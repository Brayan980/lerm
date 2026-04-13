"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { query } from "@/lib/db";
import type { InitialRegistrationData } from "@/lib/types";

interface ParticipantContextType {
  participants: InitialRegistrationData[];
  fetchParticipants: () => Promise<void>;
  getParticipantById: (id: string) => InitialRegistrationData | undefined;
  addParticipant: (data: Omit<InitialRegistrationData, "id">) => Promise<{ success: boolean; message?: string }>;
  updateParticipant: (id: string, updates: Partial<InitialRegistrationData>) => Promise<{ success: boolean; message?: string }>;
  deleteParticipant: (id: string) => Promise<{ success: boolean; message?: string }>;
  isLoadingParticipants: boolean;
}

const ParticipantContext = createContext<ParticipantContextType | undefined>(undefined);

export const ParticipantProvider = ({ children }: { children: ReactNode }) => {
  const [participants, setParticipants] = useState<InitialRegistrationData[]>([]);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(true);
  const { toast } = useToast();

  const fetchParticipants = useCallback(async () => {
    setIsLoadingParticipants(true);
    try {
      const { rows } = await query(`
        SELECT id, first_name, last_name, dob, calculated_age, sex, email, id_number, accepted_terms, created_at, updated_at
        FROM participants
        ORDER BY created_at DESC
      `);
      setParticipants(rows);
    } catch (error) {
      console.error("[ParticipantContext] Error fetching participants:", error);
      toast({
        title: "Error cargando participantes",
        description: "No se pudieron obtener los registros desde la base de datos.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingParticipants(false);
    }
  }, [toast]);

  const getParticipantById = useCallback(
    (id: string) => participants.find((p) => p.id === id),
    [participants]
  );

  const addParticipant = useCallback(async (data: Omit<InitialRegistrationData, "id">) => {
    try {
      const newId = `participant-${Date.now()}`;
      await query(
        `INSERT INTO participants (id, first_name, last_name, dob, calculated_age, sex, email, id_number, accepted_terms)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [newId, data.first_name, data.last_name, data.dob, data.calculated_age, data.sex, data.email, data.id_number, data.accepted_terms]
      );
      toast({ title: "Participante agregado", description: `${data.first_name} ${data.last_name}` });
      fetchParticipants();
      return { success: true };
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return { success: false, message: error.message };
    }
  }, [fetchParticipants, toast]);

  const updateParticipant = useCallback(async (id: string, updates: Partial<InitialRegistrationData>) => {
    try {
      const fields = Object.keys(updates);
      if (fields.length === 0) return { success: true, message: "Nada para actualizar" };

      const queryText = `
        UPDATE participants
        SET ${fields.map((f, i) => `${f} = $${i + 1}`).join(", ")}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${fields.length + 1}
      `;
      const values = [...Object.values(updates), id];
      await query(queryText, values);

      toast({ title: "Participante actualizado" });
      fetchParticipants();
      return { success: true };
    } catch (error: any) {
      console.error("[ParticipantContext] Error updating participant:", error);
      toast({ title: "Error al actualizar", description: error.message, variant: "destructive" });
      return { success: false, message: error.message };
    }
  }, [fetchParticipants, toast]);

  const deleteParticipant = useCallback(async (id: string) => {
    try {
      await query("DELETE FROM participants WHERE id = $1", [id]);
      toast({ title: "Participante eliminado" });
      fetchParticipants();
      return { success: true };
    } catch (error: any) {
      toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
      return { success: false, message: error.message };
    }
  }, [fetchParticipants, toast]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  return (
    <ParticipantContext.Provider
      value={{ participants, fetchParticipants, getParticipantById, addParticipant, updateParticipant, deleteParticipant, isLoadingParticipants }}
    >
      {children}
    </ParticipantContext.Provider>
  );
};

export const useParticipantContext = () => {
  const context = useContext(ParticipantContext);
  if (!context) throw new Error("useParticipantContext debe usarse dentro de un ParticipantProvider");
  return context;
};
