
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ChatContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  diagnosticContext: string | null;
  setDiagnosticContext: (context: string | null) => void;
  triggerOpenWithContext: (context: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [diagnosticContext, setDiagnosticContext] = useState<string | null>(null);

  const triggerOpenWithContext = (context: string) => {
    setDiagnosticContext(context);
    setIsOpen(true);
  };

  return (
    <ChatContext.Provider value={{ isOpen, setIsOpen, diagnosticContext, setDiagnosticContext, triggerOpenWithContext }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within ChatProvider');
  return context;
};
