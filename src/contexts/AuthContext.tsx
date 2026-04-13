
"use client";

import type { UserRole, AuthUser } from '@/lib/types';
import { useRouter } from 'next/navigation';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { query } from '@/lib/db';

interface AuthContextType {
  isAuthenticated: boolean;
  userRole: UserRole | null;
  username: string | null;
  login: (username: string, role: UserRole, actualRole?: UserRole) => void;
  logout: () => void;
  isLoading: boolean;
  selectedRole: UserRole | null;
  userList: AuthUser[];
  addUserToContext: (newUser: Omit<AuthUser, 'id' | 'password'> & {password: string}) => Promise<{ success: boolean; message?: string }>;
  updateUserInContext: (userId: string, updatedData: Partial<Omit<AuthUser, 'id' | 'password'>> & { password?: string }) => Promise<{ success: boolean; message?: string }>;
  deleteUserFromContext: (userId: string) => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_AUTH_KEY = 'lermUserAuth';

const initialSeedUsers: Array<Omit<AuthUser, 'id'>> = [
  { username: "admin@cecar.edu.co", password: "Admin20202025", role: "Admin" },
  { username: "evaluador@cecar.edu.co", password: "Evaluador2025", role: "Evaluator" },
  { username: "asistente@cecar.edu.co", password: "Asistente2025", role: "Assistant" },
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [userList, setUserList] = useState<AuthUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const fetchUsersFromDb = useCallback(async (): Promise<AuthUser[]> => {
    let fetchedUsers: AuthUser[] = [];
    console.log("[AUTH_CONTEXT_DB] Attempting to fetch users from database...");
    try {
      console.log("[AUTH_CONTEXT_DB] Executing initial SELECT query for users...");
      const { rows } = await query<AuthUser>('SELECT id, username, password, role FROM users');
      console.log(`[AUTH_CONTEXT_DB] Initial SELECT query found ${rows.length} users.`);

      if (rows.length === 0) {
        console.log('[AUTH_CONTEXT_SEEDER] Users table is empty. Attempting to seed initial users into the database...');
        let seedSuccessCount = 0;
        for (const seedUser of initialSeedUsers) {
          const normalizedSeedUsername = seedUser.username.toLowerCase();
          const seedUserId = `seed-${normalizedSeedUsername.split('@')[0]}-${Math.random().toString(36).substring(2,7)}`;
          try {
            await query(
              'INSERT INTO users (id, username, password, role) VALUES ($1, $2, $3, $4) ON CONFLICT (username) DO NOTHING',
              [seedUserId, normalizedSeedUsername, seedUser.password, seedUser.role]
            );
            seedSuccessCount++;
          } catch (seedError) {
            console.error(`[AUTH_CONTEXT_SEEDER_ERROR] Failed to seed user ${normalizedSeedUsername}:`, seedError);
          }
        }
        console.log(`[AUTH_CONTEXT_SEEDER] Attempted to seed ${initialSeedUsers.length} users, successfully inserted/skipped ${seedSuccessCount}.`);
        
        console.log("[AUTH_CONTEXT_DB] Re-fetching users after seeding attempt...");
        const { rows: newRowsAfterSeed } = await query<AuthUser>('SELECT id, username, password, role FROM users');
        console.log(`[AUTH_CONTEXT_DB] SELECT query after seeding found ${newRowsAfterSeed.length} users.`);
        fetchedUsers = newRowsAfterSeed.map(u => ({ 
            id: u.id, 
            username: u.username.toLowerCase(), 
            password: u.password, 
            role: u.role 
        }));
      } else {
        fetchedUsers = rows.map(u => ({ 
            id: u.id, 
            username: u.username.toLowerCase(), 
            password: u.password, 
            role: u.role 
        }));
      }
    } catch (error) {
      console.error("[AUTH_CONTEXT_DB_ERROR] Critical error fetching or seeding users from DB:", error);
      toast({
        title: "FALLA DE CONEXIÓN BD (USUARIOS)",
        description: "No se pudieron cargar los usuarios. VERIFIQUE LOS LOGS DEL SERVIDOR (POSTGRES_URL, firewall, SSL, etc.).",
        variant: "destructive",
        duration: 30000,
      });
      fetchedUsers = []; 
    }
    console.log(`[AUTH_CONTEXT_DB] Final fetchedUsers count: ${fetchedUsers.length}. Setting userList.`);
    setUserList(fetchedUsers); 
    return fetchedUsers; 
  }, [toast]);
  

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      console.log("[AUTH_CONTEXT] Loading initial auth data (useEffect)...");
      const currentFetchedUsers = await fetchUsersFromDb(); 
      console.log(`[AUTH_CONTEXT] User list fetched in loadInitialData. Count: ${currentFetchedUsers.length}. Proceeding with localStorage auth check.`);

      try {
          const storedAuth = localStorage.getItem(LOCAL_STORAGE_AUTH_KEY);
          if (storedAuth) {
              console.log("[AUTH_CONTEXT] Found auth data in localStorage:", storedAuth);
              const { username: sUsername, role: sRole, selectedRole: sSelectedRole } = JSON.parse(storedAuth);
              
              // Ensure currentFetchedUsers is up-to-date before this check
              const currentUserInList = currentFetchedUsers.find(u => u.username === sUsername?.toLowerCase() && u.role === (sRole as UserRole));
              
              if (sUsername && typeof sUsername === 'string' && sRole && typeof sRole === 'string') {
                  if (currentUserInList) {
                    console.log("[AUTH_CONTEXT] Restoring session for user:", sUsername, "Role:", sRole, "SelectedRole:", sSelectedRole || sRole);
                    setIsAuthenticated(true);
                    setUsername(sUsername.toLowerCase());
                    setUserRole(sRole as UserRole);
                    setSelectedRole(sSelectedRole as UserRole || sRole as UserRole);
                  } else {
                    console.warn(`[AUTH_CONTEXT] User ${sUsername} from localStorage not found in DB user list or role mismatch. Clearing session.`);
                    localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
                  }
              } else {
                  console.warn("[AUTH_CONTEXT] Invalid auth data structure in localStorage. Clearing session.");
                  localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
              }
          } else {
            console.log("[AUTH_CONTEXT] No auth data found in localStorage.");
          }
      } catch (error) {
          console.error("[AUTH_CONTEXT_ERROR] Error parsing auth session from localStorage:", error);
          localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
      }
      setIsLoading(false);
      console.log("[AUTH_CONTEXT] Finished loading initial auth data. isLoading set to false.");
    };
    loadInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchUsersFromDb]); // fetchUsersFromDb is memoized, will run on mount


  const login = useCallback(async (loggedInUsername: string, loggedInRole: UserRole, actualRoleToOperateAs?: UserRole) => {
    const normalizedUsername = loggedInUsername.toLowerCase();
    console.log(`[AUTH_CONTEXT] Login attempt for: ${normalizedUsername}, role: ${loggedInRole}, operateAs: ${actualRoleToOperateAs || loggedInRole}`);
    // Use the current userList from state, which should have been populated by fetchUsersFromDb
    const user = userList.find(u => u.username === normalizedUsername);

    if (user) {
        console.log(`[AUTH_CONTEXT] User ${normalizedUsername} found in userList. Authenticating.`);
        setIsAuthenticated(true);
        setUsername(normalizedUsername);
        setUserRole(loggedInRole); 
        const roleToStoreForSession = actualRoleToOperateAs || loggedInRole;
        setSelectedRole(roleToStoreForSession);
        try {
          localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, JSON.stringify({ username: normalizedUsername, role: loggedInRole, selectedRole: roleToStoreForSession }));
          console.log("[AUTH_CONTEXT] User logged in and session saved to localStorage:", normalizedUsername, "Role:", loggedInRole, "SelectedRole:", roleToStoreForSession);
        } catch (error) {
          console.error("[AUTH_CONTEXT_ERROR] Failed to save auth data to localStorage during login:", error);
        }
    } else {
        console.warn(`[AUTH_CONTEXT] Login failed: User ${normalizedUsername} not found in current userList or password mismatch.`);
        toast({
            title: "Error de inicio de sesión",
            description: "Usuario o contraseña incorrectos (contexto).",
            variant: "destructive",
          });
    }
  }, [userList, toast]);

  const logout = useCallback(() => {
    console.log("[AUTH_CONTEXT] User logging out:", username);
    setIsAuthenticated(false);
    setUserRole(null);
    setUsername(null);
    setSelectedRole(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
      console.log("[AUTH_CONTEXT] Auth data removed from localStorage.");
    } catch (error) {
      console.error("[AUTH_CONTEXT_ERROR] Failed to remove auth data from localStorage during logout:", error);
    }
    router.push('/login');
  }, [router, username]);

  const addUserToContext = useCallback(async (newUserWithoutId: Omit<AuthUser, 'id'| 'password'> & {password: string}): Promise<{ success: boolean; message?: string }> => {
    const normalizedUsername = newUserWithoutId.username.toLowerCase();
    console.log("[AUTH_CONTEXT_DB_OP] Attempting to add user to DB:", normalizedUsername);
    try {
      const { rows: existingUserRows } = await query('SELECT id FROM users WHERE username = $1', [normalizedUsername]);
      if (existingUserRows.length > 0) {
        console.warn("[AUTH_CONTEXT_DB_OP] Add user failed: Username already exists in DB -", normalizedUsername);
        return { success: false, message: 'El nombre de usuario ya existe.' };
      }
      
      const newUserId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      await query(
        'INSERT INTO users (id, username, password, role) VALUES ($1, $2, $3, $4)',
        [newUserId, normalizedUsername, newUserWithoutId.password, newUserWithoutId.role]
      );
      console.log("[AUTH_CONTEXT_DB_OP] User added to DB successfully. Fetching updated user list...");
      await fetchUsersFromDb(); 
      return { success: true };
    } catch (error: any) {
      console.error("[AUTH_CONTEXT_DB_OP_ERROR] Failed to add user to DB:", error);
      toast({
        title: "Error al Añadir Usuario",
        description: `No se pudo añadir. Revise los logs del servidor para detalles del error de BD.`,
        variant: "destructive",
        duration: 10000,
      });
      return { success: false, message: error.message || 'Error al guardar el usuario en la base de datos.' };
    }
  }, [fetchUsersFromDb, toast]);

  const updateUserInContext = useCallback(async (userId: string, updatedData: Partial<Omit<AuthUser, 'id' | 'password'>> & { password?: string }): Promise<{ success: boolean; message?: string }> => {
    console.log("[AUTH_CONTEXT_DB_OP] Attempting to update user ID in DB:", userId, "with data:", updatedData);
    try {
      const { rows: oldUserRows } = await query<AuthUser>('SELECT username, role FROM users WHERE id = $1', [userId]);
      if (oldUserRows.length === 0) {
        console.warn("[AUTH_CONTEXT_DB_OP] Update user failed: User not found in DB - ID:", userId);
        return { success: false, message: 'Usuario no encontrado.' };
      }
      const oldUser = oldUserRows[0];

      const newUsername = updatedData.username ? updatedData.username.toLowerCase() : undefined;

      if (newUsername && newUsername !== oldUser.username) {
        const { rows: existingUserRows } = await query('SELECT id FROM users WHERE username = $1 AND id != $2', [newUsername, userId]);
        if (existingUserRows.length > 0) {
          console.warn("[AUTH_CONTEXT_DB_OP] Update user failed: New username already in use in DB -", newUsername);
          return { success: false, message: 'Ese nombre de usuario ya está en uso por otra cuenta.' };
        }
      }
      
      const fieldsToUpdate: string[] = [];
      const valuesToUpdate: any[] = [];
      let valueIndex = 1;

      if (newUsername !== undefined && newUsername !== oldUser.username) {
        fieldsToUpdate.push(`username = $${valueIndex++}`);
        valuesToUpdate.push(newUsername);
      }
      if (updatedData.role !== undefined && updatedData.role !== oldUser.role) {
        fieldsToUpdate.push(`role = $${valueIndex++}`);
        valuesToUpdate.push(updatedData.role);
      }
      if (updatedData.password && updatedData.password.length > 0) {
        if (updatedData.password.length < 6) {
             console.warn("[AUTH_CONTEXT_DB_OP] Update user failed: New password too short.");
             return { success: false, message: 'La nueva contraseña debe tener al menos 6 caracteres.' };
        }
        fieldsToUpdate.push(`password = $${valueIndex++}`);
        valuesToUpdate.push(updatedData.password);
      }

      if (fieldsToUpdate.length === 0) {
        console.log("[AUTH_CONTEXT_DB_OP] No changes to update for user ID:", userId);
        return { success: true, message: 'No hay cambios para actualizar.' };
      }

      const queryText = `UPDATE users SET ${fieldsToUpdate.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${valueIndex}`;
      valuesToUpdate.push(userId);
      
      await query(queryText, valuesToUpdate);
      console.log("[AUTH_CONTEXT_DB_OP] User updated in DB successfully. Fetching updated user list...");
      
      const updatedUsersList = await fetchUsersFromDb(); 

      // Update current session if the logged-in user was the one modified
      if (username && username === oldUser.username.toLowerCase()) {
          const currentUserInNewList = updatedUsersList.find(u => u.id === userId);
          if (currentUserInNewList) {
            const newAuthUsername = currentUserInNewList.username;
            const newAuthRole = currentUserInNewList.role;
            // If the user's own role was changed, and they were operating under that role, update selectedRole
            const newAuthSelectedRole = (selectedRole === oldUser.role && updatedData.role) ? updatedData.role : selectedRole;
            
            console.log(`[AUTH_CONTEXT] Current logged-in user (${username}) was updated. Updating session details.`);
            setUsername(newAuthUsername);
            setUserRole(newAuthRole); // Actual base role
            setSelectedRole(newAuthSelectedRole); // Operating role

            localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, JSON.stringify({ 
                username: newAuthUsername, 
                role: newAuthRole, 
                selectedRole: newAuthSelectedRole 
            }));
            console.log("[AUTH_CONTEXT] Current user's session data in localStorage updated after their own data change:", newAuthUsername, "New Role:", newAuthRole, "New SelectedRole:", newAuthSelectedRole);
          } else {
            console.warn("[AUTH_CONTEXT] Current user data inconsistent after update or user deleted. Logging out.");
            logout(); // Safety logout if current user details can't be re-verified
          }
      }
      return { success: true };
    } catch (error: any) {
      console.error("[AUTH_CONTEXT_DB_OP_ERROR] Failed to update user in DB:", error);
       toast({
        title: "Error al Actualizar Usuario",
        description: `No se pudo actualizar. Revise los logs del servidor para detalles del error de BD.`,
        variant: "destructive",
        duration: 10000,
      });
      return { success: false, message: error.message || 'Error al actualizar el usuario en la base de datos.' };
    }
  }, [fetchUsersFromDb, username, selectedRole, logout, toast]);

  const deleteUserFromContext = useCallback(async (userId: string): Promise<{ success: boolean; message?: string }> => {
    console.log("[AUTH_CONTEXT_DB_OP] Attempting to delete user ID from DB:", userId);
    try {
      const { rows: userToDeleteRows } = await query<AuthUser>('SELECT username, role FROM users WHERE id = $1', [userId]);
      if (userToDeleteRows.length === 0) {
        console.warn("[AUTH_CONTEXT_DB_OP] Delete user failed: User not found in DB - ID:", userId);
        return { success: false, message: 'Usuario no encontrado.' };
      }
      const userToDelete = userToDeleteRows[0];

      if (userToDelete.username.toLowerCase() === "admin@cecar.edu.co") {
        console.warn("[AUTH_CONTEXT_DB_OP] Delete user failed: Cannot delete main admin account.");
        return { success: false, message: 'No se puede eliminar la cuenta principal de administrador.' };
      }

      await query('DELETE FROM users WHERE id = $1', [userId]);
      console.log("[AUTH_CONTEXT_DB_OP] User deleted from DB successfully. Fetching updated user list...");
      await fetchUsersFromDb(); 
      return { success: true };
    } catch (error: any) {
      console.error("[AUTH_CONTEXT_DB_OP_ERROR] Failed to delete user from DB:", error);
       toast({
        title: "Error al Eliminar Usuario",
        description: `No se pudo eliminar. Revise los logs del servidor para detalles del error de BD.`,
        variant: "destructive",
        duration: 10000,
      });
      return { success: false, message: error.message ||'Error al eliminar el usuario de la base de datos.' };
    }
  }, [fetchUsersFromDb, toast]);


  return (
    <AuthContext.Provider value={{ isAuthenticated, userRole, username, login, logout, isLoading, selectedRole, userList, addUserToContext, updateUserInContext, deleteUserFromContext }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

    
