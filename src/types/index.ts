export interface Usuario {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  rol: "coordinador" | "docente";
  horas_contrato: number;
}

export interface Planificacion {
  id: number;
  anio: number;
  semestre: 1 | 2;
  activo: boolean;
  fecha_cierre: string | null;
}

export interface Asignatura {
  id: number;
  codigo: string;
  nombre: string;
  num_estudiantes: number;
}

export interface ModuloAsignatura {
  id: number;
  asignatura: number;
  asignatura_nombre: string;
  asignatura_codigo: string;
  nombre: string;
  tipo: string;
  unidad: "periodos" | "grupos";
  factor_d: number;
  factor_i: number;
}

export interface CargaDocente {
  id: number;
  planificacion: number;
  docente: number;
  modulo: number;
  modulo_nombre: string;
  asignatura_codigo: string;
  asignatura_nombre: string;
  cantidad: number;
  horas_directas: number;
  horas_indirectas: number;
  horas_total: number;
  unidad: string;
  observaciones: string;
}

export interface OtraActividad {
  id?: number;
  planificacion: number;
  docente: number;
  descripcion: string;
  horas: number;
  tiene_resolucion: boolean;
  tiene_respaldo: boolean;
}

export interface ResumenDocente {
  docente: string;
  horas_contrato: number;
  por_asignatura: Record<string, {
    asignatura: string;
    horas_directas: number;
    horas_indirectas: number;
    modulos: Array<{ modulo: string; cantidad: number; unidad: string; horas_total: number; observaciones: string }>;
  }>;
  total_horas_directas: number;
  total_horas_indirectas: number;
  total_pregrado: number;
  total_otras_actividades: number;
  total_general: number;
  diferencia: number;
  estado: "exceso" | "deficit" | "equilibrio";
}

export interface AuthTokens {
  access: string;
  refresh: string;
}
