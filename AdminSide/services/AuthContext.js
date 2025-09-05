import React, { createContext, useContext } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ user, children }) => {
  return (
    <AuthContext.Provider value={user}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
