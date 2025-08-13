// src/components/Dashboard.jsx
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis
} from 'recharts';

// 🗺️ Leaflet (mapa)
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix de íconos Leaflet en CRA/Webpack/Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

export default function Dashboard() {
  const { token, usuario, isAuthReady, logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const ran = useRef(false); // evita doble ejecución del efecto en dev (StrictMode)

  // Estado del modal de mapa
  const [showMapa, setShowMapa] = useState(false);
  const [mapPoint, setMapPoint] = useState(null); // {lat, lng}
  const [mapInfo, setMapInfo] = useState({ titulo: '', detalle: '' });

  // ---------- Helpers de ubicaciones ----------
  const formatUbic = (ubic) => {
    if (!ubic) return '-';
    if (typeof ubic === 'string') {
      try {
        const parsed = JSON.parse(ubic);
        return formatUbic(parsed);
      } catch {
        return ubic.length > 28 ? ubic.slice(0, 28) + '…' : ubic;
      }
    }
    if (Array.isArray(ubic)) {
      if (ubic.length === 0) return '-';
      if (typeof ubic[0] === 'object' && ubic[0] !== null) {
        const last = ubic[ubic.length - 1];
        if (last?.lat != null && last?.lng != null) {
          return `${Number(last.lat).toFixed(6)}, ${Number(last.lng).toFixed(6)}`;
        }
        return `${ubic.length} punto(s)`;
      }
      const joined = ubic.join(', ');
      return joined.length > 28 ? joined.slice(0, 28) + '…' : joined;
    }
    if (typeof ubic === 'object' && ubic !== null && 'lat' in ubic && 'lng' in ubic) {
      return `${Number(ubic.lat).toFixed(6)}, ${Number(ubic.lng).toFixed(6)}`;
    }
    return '-';
  };

  const getLastLatLng = (raw) => {
    if (!raw) return null;
    let ubic = raw;
    if (typeof raw === 'string') {
      try { ubic = JSON.parse(raw); } catch {
        const m = raw.match(/(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)/);
        if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[3]) };
        return null;
      }
    }
    if (Array.isArray(ubic)) {
      if (ubic.length === 0) return null;
      const last = ubic[ubic.length - 1];
      if (last && typeof last === 'object' && last.lat != null && last.lng != null) {
        return { lat: Number(last.lat), lng: Number(last.lng) };
      }
      for (let i = ubic.length - 1; i >= 0; i--) {
        const s = String(ubic[i]);
        const m = s.match(/(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)/);
        if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[3]) };
      }
      return null;
    }
    if (typeof ubic === 'object' && ubic !== null && 'lat' in ubic && 'lng' in ubic) {
      return { lat: Number(ubic.lat), lng: Number(ubic.lng) };
    }
    return null;
  };

  const openMapa = (parte) => {
    const raw = parte.ubicaciones ?? parte.ubicacion ?? null;
    const point = getLastLatLng(raw);
    if (!point) {
      setError('Este parte no tiene coordenadas válidas.');
      return;
    }
    setMapPoint(point);
    setMapInfo({
      titulo: `Parte #${parte.id}`,
      detalle: `${parte.nombre_obra || '-'} • ${parte.nombre_equipo || '-'}`
    });
    setShowMapa(true);
    setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
  };

  const closeMapa = () => {
    setShowMapa(false);
    setMapPoint(null);
  };

  // ---------- Fetch stats con lectura segura ----------
  useEffect(() => {
    if (!isAuthReady) return;        // esperar a que cargue la auth
    if (!token) {                    // sin token -> no sigo acá
      setError('Necesitás iniciar sesión.');
      navigate('/login', { replace: true });
      return;
    }
    if (ran.current) return;
    ran.current = true;

   // const ctrl = new AbortController();

    (async () => {
      try {
        const API = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
        const res = await fetch(`${API}/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
          //signal: ctrl.signal
        });

        if (res.status === 401) {
          setError('Tu sesión expiró. Iniciá sesión de nuevo.');
          logout?.();
          navigate('/login', { replace: true });
          return;
        }

        const ct = res.headers.get('content-type') || '';
        let data = null;

        if (ct.includes('application/json')) {
          const txt = await res.text();
          data = txt ? JSON.parse(txt) : null;
        } else {
          const txt = await res.text();
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}. Respuesta no-JSON: ${txt.slice(0, 200)}`);
          }
          data = null; // si es OK pero no JSON, no rompas
        }

        if (!res.ok) {
          const msg = (data && data.error) ? data.error : `HTTP ${res.status}`;
          throw new Error(msg);
        }

        setStats(data);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error al obtener estadísticas:', err);
          setError('No se pudieron cargar las estadísticas.');
        }
      }
    })();

    //return () => ctrl.abort();
  }, [isAuthReady, token, logout, navigate]);

  // ---------- UI ----------
  if (!isAuthReady) return <p className="text-center mt-5">Cargando sesión…</p>;
  if (!stats && !error) return <p className="text-center mt-5">Cargando dashboard...</p>;

  const COLORS = ['#0d6efd', '#ffc107', '#198754'];

  const dataPie = [
    { name: 'Abiertas', value: Number(stats?.abiertas) || 0 },
    { name: 'Pausadas', value: Number(stats?.pausadas) || 0 },
    { name: 'Cerradas', value: Number(stats?.cerradas) || 0 }
  ];

  const ultimosPartes = Array.isArray(stats?.ultimosPartes) ? stats.ultimosPartes : [];
  const rankingEquipos = Array.isArray(stats?.rankingEquipos) ? stats.rankingEquipos : [];
  const cantidadPorObra = Array.isArray(stats?.cantidadPorObra) ? stats.cantidadPorObra : [];
  const rankingUsuarios = Array.isArray(stats?.rankingUsuarios) ? stats.rankingUsuarios : [];
  const promedioTareas = stats?.promedioTareas ?? '-';

  return (
    <div className="container mt-5">
      <h2 className="mb-4 text-center">📊 Dashboard</h2>

      {error && <div className="alert alert-warning text-center">{error}</div>}

      {/* Accesos */}
      <div className="mb-4 d-flex flex-wrap justify-content-center gap-2">
        <Link to="/admin" className="btn btn-outline-primary">Panel Admin</Link>
        <Link to="/ordenes/nueva" className="btn btn-outline-primary">➕ Nueva Orden</Link>
        <Link to="/ordenes/lista" className="btn btn-outline-secondary">📄 Ver Todas las Órdenes</Link>
        <Link to="/partes/nuevo" className="btn btn-outline-success">📝 Nuevo Parte</Link>
        <Link to="/partes/lista" className="btn btn-outline-success">📝 Lista de Partes</Link>
        {usuario?.role === 'admin' && (
          <>
            <Link to="/usuarios/nuevo" className="btn btn-outline-success">👤 Crear Usuario</Link>
            <Link to="/usuarios/lista" className="btn btn-outline-warning">📋 Lista de Usuarios</Link>
          </>
        )}
      </div>

      {/* Métricas rápidas */}
      <div className="row g-3">
        <div className="col-6 col-md-3">
          <div className="card text-bg-primary text-center p-3 h-100">
            <h6 className="mb-1">Órdenes Totales</h6>
            <h3 className="mb-0">{stats?.totalOrdenes ?? '-'}</h3>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card text-bg-success text-center p-3 h-100">
            <h6 className="mb-1">Usuarios</h6>
            <h3 className="mb-0">{stats?.totalUsuarios ?? '-'}</h3>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card text-bg-info text-center p-3 h-100">
            <h6 className="mb-1">Tiempo Promedio</h6>
            <h3 className="mb-0">{stats?.tiempoPromedio ?? '-'} min</h3>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card text-bg-warning text-center p-3 h-100">
            <h6 className="mb-1">Órdenes Cerradas</h6>
            <h3 className="mb-0">{stats?.cerradas ?? '-'}</h3>
          </div>
        </div>
      </div>

      {/* Estados + Top usuarios */}
      <div className="row mt-4 g-4">
        <div className="col-12 col-lg-6">
          <h5 className="text-center">📈 Estados de Órdenes</h5>
          <div className="card p-3">
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={dataPie} dataKey="value" outerRadius={90} label>
                    {dataPie.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <h5 className="text-center">🧑‍🔧 Top 3 Usuarios con más Órdenes</h5>
          <div className="card p-3">
            <ul className="list-group">
              {rankingUsuarios.slice(0, 3).map((u, i) => (
                <li key={i} className="list-group-item d-flex justify-content-between align-items-center">
                  {u.username}
                  <span className="badge bg-primary rounded-pill">{u.cantidad}</span>
                </li>
              ))}
              {rankingUsuarios.length === 0 && <li className="list-group-item">Sin datos</li>}
            </ul>
          </div>
        </div>
      </div>

      {/* Últimos Partes Diarios */}
      <div className="row mt-5">
        <h5 className="text-center">📑 Últimos Partes Diarios</h5>
        <div className="table-responsive">
          <table className="table table-striped table-bordered align-middle">
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Obra</th>
                <th>Equipo</th>
                <th>Ubicaciones</th>
              </tr>
            </thead>
            <tbody>
              {ultimosPartes.map((parte) => {
                const obra = parte.nombre_obra || '-';
                const ubicRaw = parte.ubicaciones ?? parte.ubicacion ?? '-';
                const ubicFmt = formatUbic(ubicRaw);
                return (
                  <tr key={parte.id}>
                    <td>{parte.id}</td>
                    <td>{parte.fecha ? new Date(parte.fecha).toLocaleDateString('es-AR') : '-'}</td>
                    <td>{parte.full_name || parte.usuario || '-'}</td>
                    <td title={obra}>
                      {obra.length > 28 ? obra.slice(0, 28) + '…' : obra}
                    </td>
                    <td>{parte.nombre_equipo || '-'}</td>
                    <td className="d-flex align-items-center">
                      <span title={typeof ubicFmt === 'string' ? ubicFmt : ''}>
                        {ubicFmt}
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary ms-2"
                        onClick={() => openMapa(parte)}
                        title="Ver mapa"
                      >
                        🗺️ Ver mapa
                      </button>
                    </td>
                  </tr>
                );
              })}
              {ultimosPartes.length === 0 && (
                <tr><td colSpan="6" className="text-center">Sin partes recientes</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ranking y Gráfico de partes */}
      <div className="row mt-5 g-4">
        <div className="col-12 col-lg-6">
          <h5 className="text-center">🔧 Equipos más utilizados</h5>
          <div className="card p-3">
            <ul className="list-group">
              {rankingEquipos.map((e, i) => (
                <li key={i} className="list-group-item d-flex justify-content-between align-items-center">
                  {e.nombre_equipo}
                  <span className="badge bg-success rounded-pill">{e.cantidad}</span>
                </li>
              ))}
              {rankingEquipos.length === 0 && <li className="list-group-item">Sin datos</li>}
            </ul>
          </div>
        </div>
        <div className="col-12 col-lg-6">
          <h5 className="text-center">📍 Partes por Obra</h5>
          <div className="card p-3">
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart
                  data={cantidadPorObra}
                  margin={{ top: 10, right: 10, left: 0, bottom: 30 }}
                >
                  <XAxis
                    dataKey="nombre_obra"
                    tick={{ fontSize: 11 }}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="cantidad" fill="#0d6efd" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Promedio */}
      <div className="row mt-4">
        <div className="col-12 col-md-6 col-lg-4 mx-auto">
          <div className="card text-bg-dark text-center p-3">
            <h6 className="mb-1">📊 Promedio de Tareas por Parte</h6>
            <h3 className="mb-0">{promedioTareas}</h3>
          </div>
        </div>
      </div>

      {/* 🗺️ Modal Mapa (Bootstrap simple) */}
      {showMapa && (
        <>
          <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{mapInfo.titulo}</h5>
                  <button type="button" className="btn-close" onClick={closeMapa} aria-label="Close"></button>
                </div>
                <div className="modal-body">
                  <p className="text-muted mb-2">{mapInfo.detalle}</p>
                  <div style={{ height: 400, width: '100%' }}>
                    {mapPoint && (
                      <MapContainer center={[mapPoint.lat, mapPoint.lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                          attribution='&copy; OpenStreetMap contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={[mapPoint.lat, mapPoint.lng]}>
                          <Popup>
                            {mapInfo.titulo}<br />{mapInfo.detalle}
                          </Popup>
                        </Marker>
                      </MapContainer>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeMapa}>Cerrar</button>
                </div>
              </div>
            </div>
          </div>
          {/* Backdrop */}
          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </div>
  );
}
