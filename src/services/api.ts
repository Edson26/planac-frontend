import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const api = axios.create({ baseURL: BASE_URL });

// Inyectar token en cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Refrescar token si expira
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem("refresh_token");
      if (refresh) {
        const { data } = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh });
        localStorage.setItem("access_token", data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (username: string, password: string) =>
  api.post("/auth/token/", { username, password });

// Planificaciones
export const getPlanificaciones = () => api.get("/planificaciones/");

export const getMiResumen = (id: number) =>
  api.get(`/planificaciones/${id}/mi-resumen/`);

export const getResumenPlanificacion = (id: number) =>
  api.get(`/planificaciones/${id}/resumen/`);

export const exportarExcel = (id: number) =>
  api.get(`/planificaciones/${id}/exportar_excel/`, { responseType: "blob" });

// Asignaturas y Módulos
export const getAsignaturas = () => api.get("/asignaturas/");

export const getModulos = (asignaturaId?: number) =>
  api.get("/modulos/", { params: asignaturaId ? { asignatura: asignaturaId } : {} });

// Cargas Docentes
export const getCargas = (planificacionId: number, docenteId?: number) =>
  api.get("/cargas/", { params: {
      planificacion: planificacionId,
      ...(docenteId ? { docente: docenteId } : {}),
    } });

export const bulkUpdateCargas = (cargas: object[]) =>
  api.post("/cargas/bulk_update/", { cargas });

// Otras Actividades
export const getOtrasActividades = (planificacionId: number, docenteId?: number) =>
  api.get("/otras-actividades/", {
    params: {
      planificacion: planificacionId,
      ...(docenteId ? { docente: docenteId } : {}),
    },
  });

export const crearOtraActividad = (data: object) =>
  api.post("/otras-actividades/", data);

export const actualizarOtraActividad = (id: number, data: object) =>
  api.patch(`/otras-actividades/${id}/`, data);

export const eliminarOtraActividad = (id: number) =>
  api.delete(`/otras-actividades/${id}/`);

// Usuarios
export const getUsuarios = () => api.get("/usuarios/");
export const getMiPerfil = () => api.get("/usuarios/me/");
