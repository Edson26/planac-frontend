import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getPlanificaciones, getMiResumen, getOtrasActividades  } from "../services/api";
import type { OtraActividad, Planificacion, ResumenDocente } from "../types";
import { TrendingUp, TrendingDown, Minus, BookOpen, Clock } from "lucide-react";

export default function Dashboard() {
  const { usuario } = useAuth();
  const [planificacion, setPlanificacion] = useState<Planificacion | null>(null);
  const [resumen, setResumen] = useState<ResumenDocente | null>(null);
  const [otrasActividades, setOtrasActividades] = useState<OtraActividad[]>([]);

  useEffect(() => {
    getPlanificaciones().then(({ data }) => {
      const activa = data.find((p: Planificacion) => p.activo);
      if (activa) {
        setPlanificacion(activa);
        getMiResumen(activa.id).then(({ data: r }) => setResumen(r));
        getOtrasActividades(activa.id).then(({ data }) =>
          setOtrasActividades(data)
        );
      }
    });
  }, []);

  const estadoConfig = {
    exceso: { color: "text-red-600 bg-red-50", icon: <TrendingUp className="text-red-500" />, label: "Exceso de carga" },
    deficit: { color: "text-yellow-600 bg-yellow-50", icon: <TrendingDown className="text-yellow-500" />, label: "Déficit de carga" },
    equilibrio: { color: "text-green-600 bg-green-50", icon: <Minus className="text-green-500" />, label: "Carga equilibrada" },
  };

  const cfg = resumen ? estadoConfig[resumen.estado] : null;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Bienvenido {usuario?.first_name} {usuario?.last_name}
        </h2>
        <p className="text-gray-500">
          {planificacion
            ? `${planificacion.anio} · ${planificacion.semestre === 1 ? "Primer" : "Segundo"} Semestre`
            : "Sin planificación activa"}
        </p>
      </div>

      {resumen && (
        <>
          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Horas Contrato", value: resumen.horas_contrato, icon: <Clock size={20} />, color: "bg-blue-50 text-blue-700" },
              { label: "Total Pregrado", value: resumen.total_pregrado, icon: <BookOpen size={20} />, color: "bg-indigo-50 text-indigo-700" },
              { label: "Otras Actividades", value: resumen.total_otras_actividades, icon: <BookOpen size={20} />, color: "bg-purple-50 text-purple-700" },
              { label: "Total General", value: resumen.total_general, icon: <TrendingUp size={20} />, color: "bg-gray-50 text-gray-700" },
            ].map((card) => (
              <div key={card.label} className={`rounded-xl p-5 ${card.color}`}>
                <div className="flex justify-between items-start">
                  <p className="text-sm font-medium">{card.label}</p>
                  {card.icon}
                </div>
                <p className="text-3xl font-bold mt-2">{card.value}</p>
                <p className="text-xs mt-1">horas</p>
              </div>
            ))}
          </div>

          {/* Estado de carga */}
          {cfg && (
            <div className={`flex items-center gap-3 px-5 py-4 rounded-xl mb-8 ${cfg.color}`}>
              {cfg.icon}
              <div>
                <p className="font-semibold">{cfg.label}</p>
                <p className="text-sm">
                  Diferencia de <strong>{Math.abs(resumen.diferencia)} hrs</strong> respecto al contrato
                </p>
              </div>
            </div>
          )}

          {/* Desglose por asignatura */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 overflow-hidden">
            <h3 className="bg-gray-700 text-white p-6 px-6 py-3">Desglose por Asignatura</h3>
            <div className="space-y-3 p-3">
              {Object.entries(resumen.por_asignatura).map(([codigo, data]) => (
                <div key={codigo} className="flex justify-between items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="text-xs font-mono bg-blue-100 text-blue-700 px-2 py-0.5 rounded mr-2">{codigo}</span>
                    <span className="text-sm text-gray-700">{data.asignatura}</span>
                  </div>
                  <span className="font-semibold text-gray-800">
                    {(data.horas_directas + data.horas_indirectas).toFixed(2)} hrs
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Otras Actividades */}

          {otrasActividades.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <h3 className="bg-gray-700 text-white px-6 py-3">Otras Actividades</h3>
              <div className="space-y-3 p-3">
                {otrasActividades.map((actividad) => (
                  <div
                    key={actividad.id}
                    className="flex justify-between items-center gap-4 p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-sm text-gray-700">{actividad.descripcion}</span>
                    <span className="font-semibold text-gray-800">
                      {Number(actividad.horas).toFixed(2)} hrs
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
