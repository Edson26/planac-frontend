import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  getPlanificaciones, getModulos, getCargas,
  bulkUpdateCargas, getOtrasActividades,
  crearOtraActividad, eliminarOtraActividad,
  getUsuarios,
} from "../services/api";
import type {
  Planificacion, ModuloAsignatura, CargaDocente,
  OtraActividad, Usuario,
} from "../types";
import { Save, Plus, Trash2, UserCog } from "lucide-react";

export default function FormularioCarga() {
  const { usuario } = useAuth();
  const esCoordinador = usuario?.rol === "coordinador";

  const [planificacion, setPlanificacion] = useState<Planificacion | null>(null);
  const [modulos, setModulos] = useState<ModuloAsignatura[]>([]);
  const [cargas, setCargas] = useState<Record<number, { cantidad: number; observaciones: string }>>({});
  const [otras, setOtras] = useState<OtraActividad[]>([]);
  const [nuevaActividad, setNuevaActividad] = useState({ descripcion: "", horas: 0 });
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  // Selector de docente para coordinadores
  const [docentes, setDocentes] = useState<Usuario[]>([]);
  const [docenteSeleccionado, setDocenteSeleccionado] = useState<Usuario | null>(null);

  // El docente activo es el seleccionado (coordinador) o el usuario actual (docente)
  const docenteActivo = esCoordinador ? docenteSeleccionado : usuario;

  // Cargar planificación activa y módulos al montar
  useEffect(() => {
    getPlanificaciones().then(({ data }) => {
      const activa = data.find((p: Planificacion) => p.activo);
      if (activa) setPlanificacion(activa);
    });
    getModulos().then(({ data }) => setModulos(data));

    // Si es coordinador, cargar lista de docentes
    if (esCoordinador) {
      getUsuarios().then(({ data }) => {
        setDocentes(data);
        // Por defecto, el coordinador se edita a sí mismo primero
        const yo = data.find((u: Usuario) => u.id === usuario?.id);
        if (yo) setDocenteSeleccionado(yo);
      });
    }
  }, []);

  // Recargar cargas y otras actividades cuando cambia el docente activo
  useEffect(() => {
    if (!planificacion || !docenteActivo) return;

    getCargas(planificacion.id, docenteActivo.id).then(({ data: c }) => {
      const map: Record<number, { cantidad: number; observaciones: string }> = {};
      c.forEach((carga: CargaDocente) => {
        map[carga.modulo] = {
          cantidad: carga.cantidad,
          observaciones: carga.observaciones,
        };
      });
      setCargas(map);
    });

    getOtrasActividades(planificacion.id, docenteActivo.id).then(({ data: oa }) =>
      setOtras(oa)
    );
  }, [planificacion, docenteActivo]);

  const handleCargaChange = (
    moduloId: number,
    field: "cantidad" | "observaciones",
    value: string | number
  ) => {
    setCargas((prev) => ({
      ...prev,
      [moduloId]: {
        cantidad: prev[moduloId]?.cantidad ?? 0,
        observaciones: prev[moduloId]?.observaciones ?? "",
        [field]: value,
      },
    }));
  };

  const handleGuardar = async () => {
    if (!planificacion || !docenteActivo) return;
    setGuardando(true);
    try {
      const cargasArray = Object.entries(cargas).map(([moduloId, data]) => ({
        planificacion: planificacion.id,
        modulo: parseInt(moduloId),
        cantidad: data.cantidad,
        observaciones: data.observaciones,
        // Coordinador envía el docente_id del seleccionado
        ...(esCoordinador ? { docente: docenteActivo.id } : {}),
      }));
      await bulkUpdateCargas(cargasArray);
      setMensaje("✓ Carga guardada correctamente");
      setTimeout(() => setMensaje(""), 3000);
    } catch {
      setMensaje("✗ Error al guardar. Intenta nuevamente.");
    } finally {
      setGuardando(false);
    }
  };

  const agregarOtraActividad = async () => {
    if (!planificacion || !docenteActivo || !nuevaActividad.descripcion) return;
    const { data } = await crearOtraActividad({
      ...nuevaActividad,
      planificacion: planificacion.id,
      docente: docenteActivo.id,
    });
    setOtras((prev) => [...prev, data]);
    setNuevaActividad({ descripcion: "", horas: 0 });
  };

  const eliminarActividad = async (id: number) => {
    await eliminarOtraActividad(id);
    setOtras((prev) => prev.filter((o) => o.id !== id));
  };

  // Agrupar módulos por asignatura
  const modulosPorAsignatura = modulos.reduce(
    (acc, mod) => {
      if (!acc[mod.asignatura_codigo]) {
        acc[mod.asignatura_codigo] = { nombre: mod.asignatura_nombre, modulos: [] };
      }
      acc[mod.asignatura_codigo].modulos.push(mod);
      return acc;
    },
    {} as Record<string, { nombre: string; modulos: ModuloAsignatura[] }>
  );

  const calcularTotalHoras = () =>
    modulos.reduce((sum, mod) => {
      const c = cargas[mod.id]?.cantidad ?? 0;
      return sum + c * (mod.factor_d + mod.factor_i);
    }, 0);

  const totalOtras = otras.reduce((sum, o) => sum + o.horas, 0);
  const totalGeneral = calcularTotalHoras() + totalOtras;
  const horasContrato = docenteActivo?.horas_contrato ?? 0;
  const diferencia = totalGeneral - horasContrato;

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {esCoordinador ? "Editar Planificación" : "Mi Planificación"}
          </h2>
          <p className="text-gray-500">
            {planificacion?.anio} ·{" "}
            {planificacion?.semestre === 1 ? "Primer" : "Segundo"} Semestre
          </p>
        </div>
        <button
          onClick={handleGuardar}
          disabled={guardando || !docenteActivo}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg font-medium hover:bg-primary-light transition disabled:opacity-50"
        >
          <Save size={18} /> {guardando ? "Guardando..." : "Guardar"}
        </button>
      </div>

      {/* Selector de docente — solo visible para coordinadores */}
      {esCoordinador && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <UserCog size={20} className="text-blue-600" />
            <div className="flex-1">
              <label className="text-sm font-medium text-blue-700 block mb-1">
                Editando carga de:
              </label>
              <select
                value={docenteSeleccionado?.id ?? ""}
                onChange={(e) => {
                  const docente = docentes.find(
                    (d) => d.id === parseInt(e.target.value)
                  );
                  setDocenteSeleccionado(docente ?? null);
                }}
                className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">— Selecciona un docente —</option>
                {docentes.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.first_name} {d.last_name}
                    {d.id === usuario?.id ? " (yo)" : ""}
                    {" · "}{d.horas_contrato} hrs contrato
                  </option>
                ))}
              </select>
            </div>
          </div>
          {docenteSeleccionado && (
            <p className="text-xs text-blue-500 mt-2 ml-8">
              Contrato: <strong>{docenteSeleccionado.horas_contrato} hrs</strong> ·
              Rol: <strong className="capitalize">{docenteSeleccionado.rol}</strong>
            </p>
          )}
        </div>
      )}

      {/* Si coordinador no ha seleccionado docente, mostrar mensaje */}
      {esCoordinador && !docenteSeleccionado ? (
        <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-400">
          <UserCog size={40} className="mx-auto mb-3 opacity-40" />
          <p>Selecciona un docente para editar su planificación</p>
        </div>
      ) : (
        <>
          {/* Mensaje de estado */}
          {mensaje && (
            <div
              className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
                mensaje.startsWith("✓")
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {mensaje}
            </div>
          )}

          {/* Totalizador */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-xs text-blue-500 font-medium">Total Pregrado</p>
              <p className="text-2xl font-bold text-blue-700">
                {calcularTotalHoras().toFixed(2)}
              </p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 text-center">
              <p className="text-xs text-purple-500 font-medium">Otras Actividades</p>
              <p className="text-2xl font-bold text-purple-700">
                {totalOtras.toFixed(2)}
              </p>
            </div>
            <div
              className={`rounded-xl p-4 text-center ${
                diferencia > 2
                  ? "bg-red-50"
                  : diferencia < -2
                  ? "bg-yellow-50"
                  : "bg-green-50"
              }`}
            >
              <p
                className={`text-xs font-medium ${
                  diferencia > 2
                    ? "text-red-500"
                    : diferencia < -2
                    ? "text-yellow-500"
                    : "text-green-500"
                }`}
              >
                Diferencia (contrato: {horasContrato}h)
              </p>
              <p
                className={`text-2xl font-bold ${
                  diferencia > 2
                    ? "text-red-700"
                    : diferencia < -2
                    ? "text-yellow-700"
                    : "text-green-700"
                }`}
              >
                {diferencia > 0 ? "+" : ""}
                {diferencia.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Módulos por asignatura */}
          {Object.entries(modulosPorAsignatura).map(
            ([codigo, { nombre, modulos: mods }]) => (
              <div
                key={codigo}
                className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 overflow-hidden"
              >
                <div className="bg-primary-dark text-white px-6 py-3 flex items-center gap-3">
                  <span className="font-mono text-sm bg-primary px-2 py-0.5 rounded">
                    {codigo}
                  </span>
                  <span className="font-medium">{nombre}</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {mods.map((mod) => {
                    const carga = cargas[mod.id] ?? {
                      cantidad: 0,
                      observaciones: "",
                    };
                    const horas = carga.cantidad * (mod.factor_d + mod.factor_i);
                    return (
                      <div
                        key={mod.id}
                        className="px-6 py-4 grid grid-cols-12 gap-4 items-center"
                      >
                        <div className="col-span-4">
                          <p className="font-medium text-gray-700 text-sm">
                            {mod.nombre}
                          </p>
                          <p className="text-xs text-gray-400">
                            {mod.factor_d}D + {mod.factor_i}I por{" "}
                            {mod.unidad === "grupos" ? "grupo" : "período"}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs text-gray-500 block mb-1">
                            N°{" "}
                            {mod.unidad === "grupos" ? "Grupos" : "Períodos"}
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={carga.cantidad || ""}
                            onChange={(e) =>
                              handleCargaChange(
                                mod.id,
                                "cantidad",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div className="col-span-4">
                          <label className="text-xs text-gray-500 block mb-1">
                            Observaciones
                          </label>
                          <input
                            type="text"
                            value={carga.observaciones}
                            onChange={(e) =>
                              handleCargaChange(
                                mod.id,
                                "observaciones",
                                e.target.value
                              )
                            }
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="opcional"
                          />
                        </div>
                        <div className="col-span-2 text-right">
                          <p className="text-xs text-gray-400">Total</p>
                          <p className="font-bold text-gray-800">
                            {horas.toFixed(2)} hrs
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          )}

          {/* Otras Actividades */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-700 text-white px-6 py-3">
              <span className="font-medium">Otras Actividades</span>
            </div>
            <div className="p-6 space-y-3">
              {otras.map((oa) => (
                <div
                  key={oa.id}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                >
                  <p className="flex-1 text-sm text-gray-700">{oa.descripcion}</p>
                  <span className="font-semibold text-gray-800 w-16 text-right">
                    {oa.horas} hrs
                  </span>
                  <button
                    onClick={() => eliminarActividad(oa.id!)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              {/* Formulario nueva actividad */}
              <div className="flex gap-3 mt-4">
                <input
                  type="text"
                  placeholder="Descripción de la actividad"
                  value={nuevaActividad.descripcion}
                  onChange={(e) =>
                    setNuevaActividad((p) => ({
                      ...p,
                      descripcion: e.target.value,
                    }))
                  }
                  className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="number"
                  placeholder="Hrs"
                  min="0"
                  step="0.5"
                  value={nuevaActividad.horas || ""}
                  onChange={(e) =>
                    setNuevaActividad((p) => ({
                      ...p,
                      horas: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={agregarOtraActividad}
                  className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 transition"
                >
                  <Plus size={16} /> Agregar
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
