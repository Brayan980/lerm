"use client";

import type { InitialRegistrationData } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FormDataContextType {
  initialData: InitialRegistrationData | null;
  setInitialData: (data: InitialRegistrationData | null) => void;
}

const FormDataContext = createContext<FormDataContextType | undefined>(undefined);

export const FormDataProvider = ({ children }: { children: ReactNode }) => {
  const [initialData, setInitialData] = useState<InitialRegistrationData | null>(null);

  return (
    <FormDataContext.Provider value={{ initialData, setInitialData }}>
      {children}
    </FormDataContext.Provider>
  );
};

export const useFormData = () => {
  const context = useContext(FormDataContext);
  if (context === undefined) {
    throw new Error('useFormData must be used within a FormDataProvider');
  }
  return context;
};
