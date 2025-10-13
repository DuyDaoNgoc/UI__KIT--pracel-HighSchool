// LoadingContext.tsx (nếu chưa có)
import React, { createContext, useContext, useState } from "react";

type LoadingContextType = {
  loading: boolean;
  setLoading: (val: boolean) => void;
};

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [loading, setLoading] = useState(false);
  return (
    <LoadingContext.Provider value={{ loading, setLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};

// Hook để lấy context
export const useGlobalLoading = () => {
  const ctx = useContext(LoadingContext);
  if (!ctx)
    throw new Error("useGlobalLoading must be used inside LoadingProvider");
  return ctx;
};

// ✅ Nếu bạn muốn getter global để httpGlobal sử dụng:
let globalSetLoading: ((val: boolean) => void) | null = null;
export const setGlobalLoadingSetter = (setter: (val: boolean) => void) => {
  globalSetLoading = setter;
};
export const getGlobalLoadingSetter = () => globalSetLoading;
