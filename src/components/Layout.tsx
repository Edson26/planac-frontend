import { type ReactNode } from 'react';
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { LayoutDashboard, FileSpreadsheet, ClipboardList, LogOut } from "lucide-react";

export default function Layout({ children }: { children: ReactNode }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate("/login"); };

  const navLinks = [
    { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { to: "/mi-carga", label: "Planificación", icon: <ClipboardList size={18} /> },
    ...(usuario?.rol === "coordinador"
      ? [{ to: "/resumen", label: "Resumen General", icon: <FileSpreadsheet size={18} /> }]
      : []),
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-primary-dark text-white flex flex-col">
        <div className="p-6 border-b border-primary">
          <h1 className="text-xl font-bold">PLANAC 2026</h1>
          <p className="text-xs text-blue-300 mt-1">Unidad del Adulto</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                location.pathname === link.to
                  ? "bg-primary text-white"
                  : "text-blue-200 hover:bg-primary hover:text-white"
              }`}
            >
              {link.icon} {link.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-primary">
          <p className="text-xs text-blue-300 mb-1">{usuario?.first_name} {usuario?.last_name}</p>
          <p className="text-xs text-blue-400 capitalize mb-3">{usuario?.rol}</p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-blue-200 hover:text-white transition"
          >
            <LogOut size={16} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
