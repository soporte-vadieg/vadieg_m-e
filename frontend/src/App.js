import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import LoginPage from './pages/LoginPage';
import CrearOrden from './components/CrearOrden';
import Usuario_Nuevo from './components/Usuario_Nuevo.js';
import Usuario_Lista from './components/Usuario_Lista.js';
import ListaOrdenes from './components/ListaOrdenes';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import CrearParteDiario from './components/CrearParteDiario';
import ListaParteDiario from './components/ListaParteDiario';
import AdminRoute from './admin/AdminRoute';
import AdminLayout from './admin/AdminLayout';
import AdminHome from './admin/AdminHome';
import AdminUsuarios from './admin/AdminUsuarios';
import AdminObras from './admin/AdminObras';
import AdminEquipos from './admin/AdminEquipos';
import AdminTareas from './admin/AdminTareas';
import AdminPermisos from './admin/AdminPermisos';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ConditionalHeader />
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/ordenes/nueva" element={<RequireAuth><CrearOrden /></RequireAuth>} />
          <Route path="/ordenes/lista" element={<RequireAuth><ListaOrdenes /></RequireAuth>} />          
          <Route path="/usuarios/nuevo" element={<RequireAuth><Usuario_Nuevo /></RequireAuth>} />
          <Route path="/usuarios/lista" element={<RequireAuth><Usuario_Lista /></RequireAuth>} />
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/partes/nuevo" element={<RequireAuth><CrearParteDiario /></RequireAuth>} />
          <Route path="/partes/lista" element={<RequireAuth><ListaParteDiario /></RequireAuth>} />

          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminHome />} />
              <Route path="usuarios" element={<AdminUsuarios />} />
              <Route path="obras" element={<AdminObras />} />
              <Route path="equipos" element={<AdminEquipos />} />
              <Route path="tareas" element={<AdminTareas />} />
              <Route path="permisos" element={<AdminPermisos />} />
            </Route>
          </Route>

          <Route path="*" element={<h1>404 Página no encontrada</h1>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

// Oculta el Header si está en /admin
function ConditionalHeader() {
  const location = useLocation();
  if (location.pathname.startsWith('/admin')) {
    return null;
  }
  return <Header />;
}

function RequireAuth({ children }) {
  const { usuario, isAuthReady } = useAuth();
  const location = useLocation();

  if (!isAuthReady) {
    return <p className="text-center mt-5">Cargando sesión…</p>;
  }
  if (!usuario) {
    // redirige al login y guarda de dónde venías
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}


export default App;
