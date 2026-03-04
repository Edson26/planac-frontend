import { useEffect, useState } from "react";
import { getPlanificaciones, getResumenPlanificacion, exportarExcel } from "../services/api";
import type { Planificacion, ResumenDocente } from "../types";
import { Download, TrendingUp, TrendingDown, Minus } from "lucide-react";

const ESTADO_STYLES = {
  exceso: { bg: "bg-red-100", text: "text-red-700", icon: <TrendingUp size={14} className="text-red-500" /> },
  deficit: { bg: "bg-yellow-100", text: "text-yellow-700", icon: <TrendingDown size={14} className="text-yellow-500" /> },
  equilibrio: { bg: "bg-green-100", text: "text-green-700", icon: <Minus size={14} className="text-green-500" /> },
};

export default function ResumenConsolidado() {
  const [planificacion, setPlanificacion] = useState<Planificacion | null>(null);
  const [resumen, setResumen] = useState<ResumenDocente[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");

  useEffect(() => {
    getPlanificaciones().then(({ data }) => {
      const activa = data.find((p: Planificacion) => p.activo);
      if (activa) {
        setPlanificacion(activa);
        getResumenPlanificacion(activa.id).then(({ data: r }) => setResumen(r));
      }
    });
  }, []);

  const handleExportar = async () => {
    if (!planificacion) return;
    const { data } = await exportarExcel(planificacion.id);
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `PLANAC_${planificacion.anio}_${planificacion.semestre}.xlsx`);
    link.click();
  };

  const filtrado = filtroEstado === "todos" ? resumen : resumen.filter((r) => r.estado === filtroEstado);

  const stats = {
    total: resumen.length,
    exceso: resumen.filter((r) => r.estado === "exceso").length,
    deficit: resumen.filter((r) => r.estado === "deficit").length,
    equilibrio: resumen.filter((r) => r.estado === "equilibrio").length,
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Resumen Consolidado</h2>
          <p className="text-gray-500">{planificacion?.anio} · {planificacion?.semestre === 1 ? "Primer" : "Segundo"} Semestre</p>
        </div>
        <button
          onClick={handleExportar}
          className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-green-700 transition"
        >
          <Download size={18} /> Exportar Excel
        </button>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Docentes", value: stats.total, color: "bg-blue-50 text-blue-700" },
          { label: "Equilibrados", value: stats.equilibrio, color: "bg-green-50 text-green-700" },
          { label: "Con Déficit", value: stats.deficit, color: "bg-yellow-50 text-yellow-700" },
          { label: "Con Exceso", value: stats.exceso, color: "bg-red-50 text-red-700" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-4 text-center ${s.color}`}>
            <p className="text-3xl font-bold">{s.value}</p>
            <p className="text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtro */}
      <div className="flex gap-2 mb-4">
        {["todos", "equilibrio", "deficit", "exceso"].map((f) => (
          <button
            key={f}
            onClick={() => setFiltroEstado(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition capitalize ${
              filtroEstado === f ? "bg-primary text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <th className="text-left px-6 py-3">Docente</th>
              <th className="text-center px-4 py-3">Contrato</th>
              <th className="text-center px-4 py-3">Pregrado</th>
              <th className="text-center px-4 py-3">Otras Act.</th>
              <th className="text-center px-4 py-3">Total</th>
              <th className="text-center px-4 py-3">Diferencia</th>
              <th className="text-center px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtrado.map((doc) => {
              const st = ESTADO_STYLES[doc.estado];
              return (
                <tr key={doc.docente} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-800">{doc.docente}</td>
                  <td className="px-4 py-4 text-center text-gray-600">{doc.horas_contrato}</td>
                  <td className="px-4 py-4 text-center text-gray-600">{doc.total_pregrado}</td>
                  <td className="px-4 py-4 text-center text-gray-600">{doc.total_otras_actividades}</td>
                  <td className="px-4 py-4 text-center font-semibold text-gray-800">{doc.total_general}</td>
                  <td className={`px-4 py-4 text-center font-bold ${doc.diferencia > 0 ? "text-red-600" : doc.diferencia < 0 ? "text-yellow-600" : "text-green-600"}`}>
                    {doc.diferencia > 0 ? "+" : ""}{doc.diferencia}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${st.bg} ${st.text}`}>
                      {st.icon} {doc.estado}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
