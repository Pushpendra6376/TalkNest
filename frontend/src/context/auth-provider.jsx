import { AuthContext, useAuthProvider } from "@/hooks/use-auth";

export const AuthProvider = ({ children }) => {
  const value = useAuthProvider();

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};