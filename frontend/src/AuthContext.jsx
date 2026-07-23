import { createContext, useContext, useEffect, useState } from "react";
import { api, getStoredUser, setSession, clearSession } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(false);

  // Validate stored token on first load without destroying offline session on network glitch
  useEffect(() => {
    const token = localStorage.getItem("sf_token");
    if (token) {
      api
        .getMe()
        .then((freshUser) => {
          if (freshUser) {
            setUser(freshUser);
            localStorage.setItem("sf_user", JSON.stringify(freshUser));
          }
        })
        .catch((err) => {
          // Only clear session if token is explicitly rejected (401 Unauthorized)
          if (err && (err.status === 401 || (err.message && err.message.includes("401")))) {
            clearSession();
            setUser(null);
          }
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
