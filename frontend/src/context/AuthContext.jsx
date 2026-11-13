import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { authApi } from "../services/api";

const AuthContext = createContext(null);

// Pulls the backend's ErrorResponse.message (see GlobalExceptionHandler)
// out of an axios error, falling back to a generic message.
function normalizeError(err) {
  const message = err?.response?.data?.message || "Something went wrong. Please try again.";
  return new Error(message);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authApi.getCurrentUser());
  const [initializing, setInitializing] = useState(true);

  const logout = useCallback(() => {
    authApi.logout();
    setUser(null);
  }, []);

  // On load, if a token is stored, confirm it's still valid against the backend.
  useEffect(() => {
    const stored = authApi.getCurrentUser();
    if (!stored?.token) {
      setInitializing(false);
      return;
    }
    authApi
      .me()
      .then((profile) => setUser(profile))
      .catch(() => logout())
      .finally(() => setInitializing(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async ({ email, password }) => {
    try {
      const data = await authApi.login(email, password);
      setUser(data);
      return data;
    } catch (err) {
      throw normalizeError(err);
    }
  }, []);

  const signup = useCallback(async (fields) => {
    try {
      const data = await authApi.signup(fields);
      setUser(data);
      return data;
    } catch (err) {
      throw normalizeError(err);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, initializing, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
