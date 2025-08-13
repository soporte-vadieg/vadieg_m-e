// src/admin/AdminLayout.jsx
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/vadieg_logo.svg';

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { usuario } = useAuth();

  return (
    <div className="d-flex min-vh-100">
      {/* Sidebar */}
      <aside className={`bg-dark text-white p-3 ${open ? 'd-block' : 'd-none'} d-md-block`} style={{width: 260}}>
        <div className="d-flex align-items-center gap-2 mb-3">
          <img src={logo} alt="VADIEG" height="32" />          
        </div>
        <nav className="nav flex-column">
          <NavLink to="/admin" end className="nav-link text-white">🏠 Inicio</NavLink>
          <NavLink to="/admin/usuarios" className="nav-link text-white">👥 Usuarios</NavLink>
          <NavLink to="/admin/obras" className="nav-link text-white">🏗️ Obras</NavLink>
          <NavLink to="/admin/equipos" className="nav-link text-white">🚜 Equipos</NavLink>
          <NavLink to="/admin/tareas" className="nav-link text-white">🧰 Tareas</NavLink>
          <NavLink to="/admin/permisos" className="nav-link text-white">🔐 Permisos</NavLink>
          <NavLink to="/dashboard" className="nav-link text-white">Volver al dashboard</NavLink>
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-grow-1">
        <header className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom">
          <button className="btn btn-outline-secondary d-md-none" onClick={()=>setOpen(!open)}>☰</button>
          <h5 className="m-0">Panel de administración</h5>
          <div className="small text-muted">👤 {usuario?.full_name}</div>
        </header>
        <div className="p-3">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
