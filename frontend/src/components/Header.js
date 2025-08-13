import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/vadieg_logo.svg';

export default function Header() {
  const { usuario, setUsuario, setToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const ocultarNavItems = location.pathname === '/dashboard' || location.pathname.startsWith('/admin');

  const handleLogout = () => {
    setUsuario(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/login');
  };

  const esAdmin = usuario?.role === 'admin';
  const tienePermiso = (permiso) => usuario?.permisos?.includes(permiso);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-4">
      <Link className="navbar-brand" to="/dashboard">
        <img
          src={logo}
          alt="VADIEG"
          height="40"
          className="d-inline-block align-text-top"
        />
      </Link>

      <div className="collapse navbar-collapse">
        {usuario && !ocultarNavItems && (
          <ul className="navbar-nav me-auto">
            {tienePermiso('orden-servicio') && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/ordenes/nueva">Nueva Orden</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/ordenes/lista">Lista de Órdenes</Link>
                </li>
              </>
            )}

            {tienePermiso('maquinista') && (
              <li className="nav-item">
                <span className="nav-link disabled"></span>
              </li>
            )}

            {esAdmin && (
              <>
                   {/* 🔹 Botón directo al panel admin */}
                <li className="nav-item">
                  <Link className="nav-link text-warning fw-bold" to="/admin">
                    ⚙ Panel Admin
                  </Link>
                </li>
              </>
            )}
          </ul>
        )}

        <div className="d-flex align-items-center ms-auto">
          {usuario ? (
            <>
              <span className="navbar-text me-3">👤 {usuario.full_name}</span>
              <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
                Cerrar sesión
              </button>
            </>
          ) : (
            <Link className="btn btn-outline-light btn-sm" to="/login">
              Iniciar sesión
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
