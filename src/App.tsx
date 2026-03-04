import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import FormularioCarga from "./pages/FormularioCarga";
import ResumenConsolidado from "./pages/ResumenConsolidado";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { usuario, isLoading } = useAuth();

  // ← CLAVE: esperar a que termine de verificar la sesión
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return usuario ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
}

function CoordinadorRoute({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuth();
  return usuario?.rol === "coordinador" ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/mi-carga" element={<PrivateRoute><FormularioCarga /></PrivateRoute>} />
          <Route path="/resumen" element={
            <PrivateRoute>
              <CoordinadorRoute><ResumenConsolidado /></CoordinadorRoute>
            </PrivateRoute>
          } />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
