import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ListaPartesDiarios() {
  const { token } = useAuth();

  const [partesDiarios, setPartesDiarios] = useState([]);
  const [tareasPorParte, setTareasPorParte] = useState({});
  const [mensaje, setMensaje] = useState('');

  // Catálogos
  const [usuarios, setUsuarios] = useState([]);
  const [obras, setObras] = useState([]);
  const [equipos, setEquipos] = useState([]);

  // Filtros
  const [filtroFecha, setFiltroFecha] = useState('');      // yyyy-mm-dd
  const [filtroObra, setFiltroObra] = useState('');        // id o ''
  const [filtroEquipo, setFiltroEquipo] = useState('');    // id o ''

  const headers = useMemo(() => ({
    'Authorization': `Bearer ${token}`
  }), [token]);

  // Helpers: lookups id -> nombre
  const lookupUsuarios = useMemo(() => {
    const map = {};
    usuarios.forEach(u => { map[u.id] = u.full_name || u.nombre || u.username; });
    return map;
  }, [usuarios]);

  const lookupObras = useMemo(() => {
    const map = {};
    obras.forEach(o => { map[o.id] = o.cod_obra || o.nombre_obra || `Obra ${o.id}`; });
    return map;
  }, [obras]);

  const lookupEquipos = useMemo(() => {
    const map = {};
    equipos.forEach(e => { map[e.id] = e.nombre_equipo || e.descripcion || `Equipo ${e.id}`; });
    return map;
  }, [equipos]);

  const fetchPartesDiarios = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/partes/lista`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al obtener los partes diarios');
      setPartesDiarios(data);
    } catch (error) {
      console.error(error);
      setMensaje('❌ Error al obtener los partes diarios');
    }
  }, [headers]);

  const fetchTareasDeParte = useCallback(async (parteId) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/partes/lista/${parteId}`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al obtener las tareas');

      setTareasPorParte(prev => ({ ...prev, [parteId]: data }));
    } catch (error) {
      console.error(error);
      setMensaje('❌ Error al obtener las tareas');
    }
  }, [headers]);

  // Catálogos
  const fetchCatalogos = useCallback(async () => {
    try {
      const [rUsuarios, rObras, rEquipos] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_URL}/usuarios/lista`, { headers }),
        fetch(`${process.env.REACT_APP_API_URL}/obras/lista`, { headers }),
        fetch(`${process.env.REACT_APP_API_URL}/equipos/lista`, { headers }),
      ]);
      const [dUsuarios, dObras, dEquipos] = await Promise.all([
        rUsuarios.json(), rObras.json(), rEquipos.json()
      ]);

      if (!rUsuarios.ok) throw new Error(dUsuarios.error || 'Error usuarios');
      if (!rObras.ok) throw new Error(dObras.error || 'Error obras');
      if (!rEquipos.ok) throw new Error(dEquipos.error || 'Error equipos');

      setUsuarios(dUsuarios);
      setObras(dObras);
      setEquipos(dEquipos);
    } catch (e) {
      console.error(e);
      // No detengas la vista por catálogos: solo avisá
      setMensaje('⚠️ No se pudieron cargar algunos catálogos (usuarios/obras/equipos).');
    }
  }, [headers]);

  useEffect(() => {
    fetchCatalogos();
    fetchPartesDiarios();
  }, [fetchCatalogos, fetchPartesDiarios]);

  // Traer tareas por cada parte (como ya lo hacías)
  useEffect(() => {
    partesDiarios.forEach((parte) => {
      if (!tareasPorParte[parte.id]) {
        fetchTareasDeParte(parte.id);
      }
    });
  }, [partesDiarios, tareasPorParte, fetchTareasDeParte]);

  // Filtrado cliente
  const partesFiltradas = useMemo(() => {
    return partesDiarios.filter(p => {
      const coincideFecha = !filtroFecha
        ? true
        : (new Date(p.fecha).toISOString().slice(0, 10) === filtroFecha);

      const coincideObra = !filtroObra ? true : String(p.obra_id) === String(filtroObra);
      const coincideEquipo = !filtroEquipo ? true : String(p.equipo_id) === String(filtroEquipo);

      return coincideFecha && coincideObra && coincideEquipo;
    });
  }, [partesDiarios, filtroFecha, filtroObra, filtroEquipo]);

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Lista de Partes Diarios</h2>

      {mensaje && <div className="alert alert-warning">{mensaje}</div>}

      {/* Filtros */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-12 col-md-4">
              <label className="form-label">Fecha</label>
              <input
                type="date"
                className="form-control"
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
              />
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label">Obra</label>
              <select
                className="form-select"
                value={filtroObra}
                onChange={(e) => setFiltroObra(e.target.value)}
              >
                <option value="">Todas</option>
                {obras.map(o => (
                  <option key={o.id} value={o.id}>{lookupObras[o.id] || `Obra ${o.id}`}</option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label">Equipo</label>
              <select
                className="form-select"
                value={filtroEquipo}
                onChange={(e) => setFiltroEquipo(e.target.value)}
              >
                <option value="">Todos</option>
                {equipos.map(eq => (
                  <option key={eq.id} value={eq.id}>{lookupEquipos[eq.id] || `Equipo ${eq.id}`}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 d-flex gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => {
                setFiltroFecha('');
                setFiltroObra('');
                setFiltroEquipo('');
              }}
            >
              Limpiar filtros
            </button>
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={fetchPartesDiarios}
            >
              Refrescar lista
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      {partesFiltradas.length === 0 ? (
        <p className="text-center">No hay partes diarios para los filtros actuales.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-hover shadow-sm align-middle">
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Obra</th>
                <th>Equipo</th>
                <th>Horómetro Inicio</th>
                <th>Observaciones</th>
                <th>Tareas</th>
                <th>Fecha Creación</th>
              </tr>
            </thead>
            <tbody>
              {partesFiltradas.map((parte) => (
                <tr key={parte.id}>
                  <td>{parte.id}</td>
                  <td>{new Date(parte.fecha).toLocaleDateString('es-AR')}</td>
                  <td>{lookupUsuarios[parte.usuario_id] || parte.usuario_id}</td>
                  <td>{lookupObras[parte.obra_id] || parte.obra_id}</td>
                  <td>{lookupEquipos[parte.equipo_id] || parte.equipo_id}</td>
                  <td>{parte.horometro_inicio}</td>
                  <td>{parte.observaciones || '—'}</td>
                  <td>
                    {tareasPorParte[parte.id] ? (
                      tareasPorParte[parte.id].length > 0 ? (
                        <ul className="mb-0">
                          {tareasPorParte[parte.id].map((t) => (
                            <li key={t.id}>
                              {t.descripcion_tarea || t.descripcion || t.nombre || `Tarea ${t.id}`}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-muted">Sin tareas</span>
                      )
                    ) : (
                      <span className="text-muted">Cargando…</span>
                    )}
                  </td>
                  <td>{new Date(parte.created_at).toLocaleString('es-AR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
