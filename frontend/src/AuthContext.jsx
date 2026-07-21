import { createContext, useContext, useEffect, useState } from "react";
import { api, getStoredUser, setSession, clearSession } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(false);

  // Validate a stored token on first load
  useEffect(() => {
    const token = localStorage.getItem("sf_token");
    if (token && user) {
      api
        .getMe()
        .catch(() => {
          clearSession();
          setUser(null);
        });
    }
  }, []);

  const loginWithGoogle = async (idToken) => {
    setLoading(true);
    try {
      const res = await api.loginWithGoogle(idToken);
      setSession(res.token, res.user);
      setUser(res.user);
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (token, user) => {
    setSession(token, user);
    setUser(user);
    return user;
  };

  const signup = async (email, password, name) => {
    setLoading(true);
    try {
      const res = await api.signup(email, password, name);
      setSession(res.token, res.user);
      setUser(res.user);
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.login(email, password);
      setSession(res.token, res.user);
      setUser(res.user);
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithGoogle,
        loginWithEmail,
        signup,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
