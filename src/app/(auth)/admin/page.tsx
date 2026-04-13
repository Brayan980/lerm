
"use client";

import AuthWrapper from "@/components/auth/AuthWrapper";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { UserRole, AuthUser } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, UserPlus, Users, Edit, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const newUserSchema = z.object({
  username: z.string().email({ message: "Debe ser un correo electrónico válido." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
  role: z.enum(["Admin", "Evaluator", "Assistant"], { required_error: "El rol es obligatorio." }),
});
type NewUserFormValues = z.infer<typeof newUserSchema>;

const editUserSchema = z.object({
  username: z.string().email({ message: "Debe ser un correo electrónico válido." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }).optional().or(z.literal('')),
  role: z.enum(["Admin", "Evaluator", "Assistant"], { required_error: "El rol es obligatorio." }),
});
type EditUserFormValues = z.infer<typeof editUserSchema>;


export default function AdminPage() {
  const { userList, addUserToContext, updateUserInContext, deleteUserFromContext, username: currentAdminUsername } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const newUserForm = useForm<NewUserFormValues>({
    resolver: zodResolver(newUserSchema),
    defaultValues: { username: "", password: "", role: undefined },
  });

  const editUserForm = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: { username: "", password: "", role: undefined },
  });

  useEffect(() => {
    if (editingUser) {
      editUserForm.reset({
        username: editingUser.username,
        password: "", 
        role: editingUser.role,
      });
    }
  }, [editingUser, editUserForm]);

  async function onCreateUserSubmit(values: NewUserFormValues) {
    setIsSubmitting(true);
    const result = await addUserToContext(values); // username will be lowercased in context
    if (result.success) {
      toast({ title: "Usuario Creado", description: `El usuario ${values.username.toLowerCase()} ha sido creado exitosamente.` });
      newUserForm.reset();
    } else {
      toast({ title: "Error al Crear Usuario", description: result.message || "No se pudo crear el usuario.", variant: "destructive" });
    }
    setIsSubmitting(false);
  }

  async function onEditUserSubmit(values: EditUserFormValues) {
    if (!editingUser) return;
    setIsEditing(true);
    
    const updatePayload: Partial<Omit<AuthUser, 'id' | 'password'>> & { password?: string } = {};

    // Username will be lowercased in context if changed
    if (values.username.toLowerCase() !== editingUser.username.toLowerCase()) {
        updatePayload.username = values.username; // Pass as is, context will lowercase
    }
    if (values.role !== editingUser.role) {
        updatePayload.role = values.role;
    }

    if (values.password && values.password.length > 0) {
        updatePayload.password = values.password;
    }
    
    const isMainAdminAccount = editingUser.username.toLowerCase() === "admin@cecar.edu.co" && editingUser.role === "Admin";
    if (isMainAdminAccount) {
        if (values.username.toLowerCase() !== "admin@cecar.edu.co") {
            toast({ title: "Acción no permitida", description: "No se puede cambiar el nombre de usuario de la cuenta principal de administrador.", variant: "destructive"});
            setIsEditing(false);
            return;
        }
        if (values.role !== "Admin") {
             toast({ title: "Acción no permitida", description: "No se puede cambiar el rol de la cuenta principal de administrador.", variant: "destructive"});
            setIsEditing(false);
            return;
        }
        const mainAdminPayload: {password?:string} = {};
        if (updatePayload.password) mainAdminPayload.password = updatePayload.password;
        
        const result = await updateUserInContext(editingUser.id, mainAdminPayload);
        if (result.success) {
          toast({ title: "Usuario Actualizado", description: `El usuario ${editingUser.username} ha sido actualizado.` });
          setShowEditDialog(false);
          setEditingUser(null);
        } else {
          toast({ title: "Error al Actualizar", description: result.message || "No se pudo actualizar el usuario.", variant: "destructive" });
        }
        setIsEditing(false);
        return;
    }


    const result = await updateUserInContext(editingUser.id, updatePayload);
    if (result.success) {
      toast({ title: "Usuario Actualizado", description: `El usuario ${values.username.toLowerCase() || editingUser.username} ha sido actualizado.` });
      setShowEditDialog(false);
      setEditingUser(null);
    } else {
      toast({ title: "Error al Actualizar", description: result.message || "No se pudo actualizar el usuario.", variant: "destructive" });
    }
    setIsEditing(false);
  }

  async function handleDeleteUser() {
    if (!deletingUserId) return;
    const result = await deleteUserFromContext(deletingUserId);
    if (result.success) {
      toast({ title: "Usuario Eliminado", description: `El usuario ha sido eliminado.` });
    } else {
      toast({ title: "Error al Eliminar", description: result.message || "No se pudo eliminar el usuario.", variant: "destructive" });
    }
    setDeletingUserId(null); 
  }

  const openEditDialog = (user: AuthUser) => {
    setEditingUser(user);
    editUserForm.reset({
        username: user.username,
        password: "", 
        role: user.role,
    });
    setShowEditDialog(true);
  };
  
  const isUserMainAdminAccount = (user: AuthUser) => {
    return user.username.toLowerCase() === "admin@cecar.edu.co" && user.role === "Admin";
  };


  return (
    <AuthWrapper allowedRoles={["Admin"]}>
      <div className="space-y-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-headline flex items-center"><Users className="mr-3 h-8 w-8 text-primary" /> Panel de Administración</CardTitle>
            <CardDescription>Gestión de usuarios del sistema.</CardDescription>
          </CardHeader>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="shadow-md lg:col-span-1">
            <CardHeader><CardTitle className="text-xl flex items-center"><UserPlus className="mr-2 h-6 w-6 text-primary" /> Crear Nuevo Usuario</CardTitle></CardHeader>
            <CardContent>
              <Form {...newUserForm}>
                <form onSubmit={newUserForm.handleSubmit(onCreateUserSubmit)} className="space-y-6">
                  <FormField control={newUserForm.control} name="username" render={({ field }) => (<FormItem><FormLabel>Correo Electrónico</FormLabel><FormControl><Input placeholder="usuario@ejemplo.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={newUserForm.control} name="password" render={({ field }) => (<FormItem><FormLabel>Contraseña</FormLabel><FormControl><Input type="password" placeholder="********" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={newUserForm.control} name="role" render={({ field }) => (<FormItem><FormLabel>Rol</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione un rol" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Admin">Administrador</SelectItem><SelectItem value="Evaluator">Evaluador</SelectItem><SelectItem value="Assistant">Asistente</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                  <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Crear Usuario</Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="shadow-md lg:col-span-2">
            <CardHeader><CardTitle className="text-xl">Lista de Usuarios</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Usuario</TableHead><TableHead>Rol</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                <TableBody>
                  {userList && userList.length > 0 ? (
                    userList.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="outline" size="sm" onClick={() => openEditDialog(user)} className="text-primary border-primary hover:bg-primary/10 hover:text-primary">
                            <Edit className="mr-1 h-4 w-4" /> Editar
                          </Button>
                          {!isUserMainAdminAccount(user) ? (
                            <Button variant="destructive" size="sm" onClick={() => setDeletingUserId(user.id)}>
                              <Trash2 className="mr-1 h-4 w-4" /> Eliminar
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" disabled className="opacity-50">
                                <Trash2 className="mr-1 h-4 w-4" /> Eliminar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No hay usuarios para mostrar.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={(isOpen) => { setShowEditDialog(isOpen); if (!isOpen) setEditingUser(null); }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>Editar Usuario</DialogTitle><DialogDescription>Modifique los detalles del usuario. Deje la contraseña en blanco para no cambiarla.</DialogDescription></DialogHeader>
          {editingUser && (
            <Form {...editUserForm}>
              <form onSubmit={editUserForm.handleSubmit(onEditUserSubmit)} className="space-y-4 py-4">
                <FormField control={editUserForm.control} name="username" render={({ field }) => (<FormItem><FormLabel>Correo Electrónico</FormLabel><FormControl><Input {...field} disabled={isUserMainAdminAccount(editingUser)} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={editUserForm.control} name="password" render={({ field }) => (<FormItem><FormLabel>Nueva Contraseña (opcional)</FormLabel><FormControl><Input type="password" placeholder="Dejar en blanco para no cambiar" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={editUserForm.control} name="role" render={({ field }) => (<FormItem><FormLabel>Rol</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isUserMainAdminAccount(editingUser)}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione un rol" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Admin">Administrador</SelectItem><SelectItem value="Evaluator">Evaluador</SelectItem><SelectItem value="Assistant">Asistente</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                  <Button type="submit" disabled={isEditing}>{isEditing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guardar Cambios</Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={!!deletingUserId} onOpenChange={(open) => !open && setDeletingUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>¿Está seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente la cuenta del usuario.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingUserId(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className={buttonVariants({ variant: "destructive" })}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </AuthWrapper>
  );
}
