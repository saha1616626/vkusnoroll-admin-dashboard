import { createContext, useState, useEffect } from 'react';

export const PageContext = createContext();

export const FormProvider = ({ children }) => {
  const [formState, setFormState] = useState({
    isOpen: false,
    isEditing: false,
    initialData: null,
    currentData: null,
    hasChanges: false
  });

  // Восстановление состояния из localStorage
  useEffect(() => {
    const savedForm = localStorage.getItem('activeForm');
    if(savedForm) {
      setFormState(JSON.parse(savedForm));
    }
  }, []);

  // Автосохранение при изменениях
  useEffect(() => {
    if(formState.isOpen) {
      localStorage.setItem('activeForm', JSON.stringify(formState));
    }
  }, [formState]);

  return (
    <PageContext.Provider value={{ formState, setFormState }}>
      {children}
    </PageContext.Provider>
  );
};