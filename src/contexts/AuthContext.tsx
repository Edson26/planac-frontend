import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { login as loginApi, api } from "../services/api";
import type { Usuario } from "../types";
import { jwtDecode } from "jwt-decode";

interface JwtPayload {
  user?: Usuario;
  exp: number;
}

interface AuthContextType {
  usuario: Usuario | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Intenta restaurar sesión al recargar la página
  useEffect(() => {
    const restaurarSesion = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) { setIsLoading(false); return; }

      try {
        const decoded = jwtDecode<JwtPayload>(token);

        // Token expirado
        if (decoded.exp * 1000 < Date.now()) {
          await intentarRefrescar();
          return;
        }

        // Si el token tiene los datos del usuario (fix backend aplicado)
        if (decoded.user) {
          setUsuario(decoded.user);
        } else {
          // Fallback: obtener perfil desde la API
          await obtenerPerfilDesdeAPI();
        }
      } catch {
        limpiarSesion();
      } finally {
        setIsLoading(false);
      }
    };

    restaurarSesion();
  }, []);

  const intentarRefrescar = async () => {
    const refresh = localStorage.getItem("refresh_token");
    if (!refresh) { limpiarSesion(); setIsLoading(false); return; }
    try {
      const { data } = await api.post("/auth/token/refresh/", { refresh });
      localStorage.setItem("access_token", data.access);
      const decoded = jwtDecode<JwtPayload>(data.access);
      if (decoded.user) setUsuario(decoded.user);
      else await obtenerPerfilDesdeAPI();
    } catch {
      limpiarSesion();
    } finally {
      setIsLoading(false);
    }
  };

  const obtenerPerfilDesdeAPI = async () => {
    try {
      const { data } = await api.get("/usuarios/me/");
      setUsuario(data);
    } catch {
      limpiarSesion();
    }
  };

  const limpiarSesion = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUsuario(null);
  };

  const login = async (username: string, password: string) => {
    const { data } = await loginApi(username, password);
    localStorage.setItem("access_token", data.access);
    localStorage.setItem("refresh_token", data.refresh);

    // Leer usuario del token o desde la API
    try {
      const decoded = jwtDecode<JwtPayload>(data.access);
      if (decoded.user) {
        setUsuario(decoded.user);
      } else {
        await obtenerPerfilDesdeAPI();
      }
    } catch {
      await obtenerPerfilDesdeAPI();
    }
  };

  const logout = () => {
    limpiarSesion();
  };

  return (
    <AuthContext.Provider value={{ usuario, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
};
