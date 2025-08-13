import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

/* ==================== GEOLOCALIZACIÓN (NUEVO) ==================== */
async function capturarUbicacion() {
  if (!('geolocation' in navigator)) throw new Error('Geolocalización no soportada');

  const pos = await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 60000
    });
  });

  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    precision_m: Math.round(pos.coords.accuracy || 0),
    fuente: 'gps'
  };
}

async function guardarUbicacionDeParte(parteId, token, usuarioId) {
  const geo = await capturarUbicacion();
  const res = await fetch(`${process.env.REACT_APP_API_URL}/ubicaciones`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      entity: 'parte',
      entity_id: parteId,
      usuario_id: usuarioId,
      ...geo
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'No se pudo guardar la ubicación');
  }
}
/* ================================================================ */

export default function CrearParteDiario() {
  const { usuario, token } = useAuth();
  const [fecha] = useState(new Date().toISOString().split('T')[0]);

  // 📦 Datos en caché
  const [cabecera, setCabecera] = useState({
    usuario_id: usuario?.id || '',
    obra_id: '',
    equipo_id: '',
    horometro_inicio: '',
    observaciones: '',
    fecha: fecha
  });

  const [tareas, setTareas] = useState([]);
  const [detalle, setDetalle] = useState([]);
  const [obras, setObras] = useState([]);

  // 🔽 Selects dependientes desde backend
  const [tipos, setTipos] = useState([]);
  const [tipoSeleccionado, setTipoSeleccionado] = useState('');
  const [equipos, setEquipos] = useState([]);

  const [mensaje, setMensaje] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);

  const [horometro, setHorometro] = useState('');
  const [tareaId, setTareaId] = useState('');

  // 🔁 Cargar tareas, obras y tipos de equipos (una vez)
  useEffect(() => {
    const fetchInicial = async () => {
      try {
        const [resTareas, resObras, resTipos] = await Promise.all([
          fetch(`${process.env.REACT_APP_API_URL}/partes/tareas`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${process.env.REACT_APP_API_URL}/obras`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${process.env.REACT_APP_API_URL}/equipos/tipos`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        setTareas(await resTareas.json());
        setObras(await resObras.json());
        setTipos(await resTipos.json());
      } catch (error) {
        console.error(error);
        setMensaje('❌ Error al cargar datos iniciales');
      }
    };
    fetchInicial();
  }, [token]);

  // 🔁 Cuando cambia el tipo, pedir equipos filtrados al backend
  useEffect(() => {
    const cargarEquipos = async () => {
      if (!tipoSeleccionado) {
        setEquipos([]);
        setCabecera(prev => ({ ...prev, equipo_id: '' }));
        return;
      }
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/equipos?tipo=${encodeURIComponent(tipoSeleccionado)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        setEquipos(data || []);
        if (Array.isArray(data) && data.length === 1) {
          setCabecera(prev => ({ ...prev, equipo_id: String(data[0].id) }));
        } else {
          setCabecera(prev => ({ ...prev, equipo_id: '' }));
        }
      } catch (error) {
        console.error(error);
        setMensaje('❌ Error al cargar equipos por tipo');
      }
    };
    cargarEquipos();
  }, [tipoSeleccionado, token]);

  const agregarLinea = () => {
    if (!horometro || !tareaId) return;
    const horaActual = new Date().toLocaleTimeString('es-AR', { hour12: false });
    const nuevaLinea = {
      hora: horaActual,
      horometro_km: horometro,
      tarea_id: tareaId
    };
    setDetalle(d => [...d, nuevaLinea]);
    setHorometro('');
    setTareaId('');
    setMostrarModal(false);
    setMensaje('✅ Tarea agregada al parte (en caché)');
  };

  const finalizarParte = async () => {
    try {
      // 👉 1) Crear cabecera
      const resCabecera = await fetch(`${process.env.REACT_APP_API_URL}/partes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(cabecera)
      });

      const data = await resCabecera.json();
      if (!resCabecera.ok) throw new Error(data.error || 'Error al crear cabecera');
      const parteId = data.id;

      // 👉 1.1) Guardar ubicación (no bloquea si falla)
      guardarUbicacionDeParte(parteId, token, usuario.id)
        .then(() => setMensaje('📍 Ubicación registrada'))
        .catch(err => console.warn('Ubicación no registrada:', err.message));

      // 👉 2) Guardar detalle
      for (const linea of detalle) {
        const r = await fetch(`${process.env.REACT_APP_API_URL}/partes/${parteId}/detalle`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(linea)
        });
        if (!r.ok) {
          const e = await r.json().catch(() => ({}));
          throw new Error(e.error || 'Error al guardar detalle');
        }
      }

      setMensaje('✅ Parte guardado correctamente en la base de datos');
      setCabecera({
        usuario_id: usuario?.id || '',
        obra_id: '',
        equipo_id: '',
        horometro_inicio: '',
        observaciones: '',
        fecha: fecha
      });
      setDetalle([]);
      setTipoSeleccionado('');
      setEquipos([]);
    } catch (error) {
      console.error(error);
      setMensaje(`❌ ${error.message || 'Error al guardar el parte'}`);
    }
  };

  return (
    <div className="container mt-4">
      <h2>📋 Crear Parte Diario</h2>

      {/* Cabecera */}
      <div className="card p-4 mb-4">
        <div className="row">
          <div className="col-md-3 mb-3">
            <label>Obra</label>
            <select
              className="form-select"
              value={cabecera.obra_id}
              onChange={e => setCabecera({ ...cabecera, obra_id: e.target.value })}
            >
              <option value="">-- Seleccionar obra --</option>
              {obras.map(obra => (
                <option key={obra.id} value={obra.id}>{obra.nombre_obra}</option>
              ))}
            </select>
          </div>

          {/* Tipo de Equipo */}
          <div className="col-md-3 mb-3">
            <label>Tipo de equipo</label>
            <select
              className="form-select"
              value={tipoSeleccionado}
              onChange={e => setTipoSeleccionado(e.target.value)}
            >
              <option value="">-- Seleccionar tipo --</option>
              {tipos.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Equipo (filtrado por tipo) */}
          <div className="col-md-3 mb-3">
            <label>Equipo</label>
            <select
              className="form-select"
              value={cabecera.equipo_id}
              onChange={e => setCabecera({ ...cabecera, equipo_id: e.target.value })}
              disabled={!tipoSeleccionado}
            >
              <option value="">
                {tipoSeleccionado ? '-- Seleccionar equipo --' : 'Seleccione un tipo primero'}
              </option>
              {equipos.map(eq => (
                <option key={eq.id} value={eq.id}>
                  {eq.nombre_equipo} - {eq.descripcion}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-3 mb-3">
            <label>Horómetro inicial</label>
            <input
              type="number"
              step="0.001"
              className="form-control"
              value={cabecera.horometro_inicio}
              onChange={e => setCabecera({ ...cabecera, horometro_inicio: e.target.value })}
            />
          </div>

          <div className="col-12 mb-3">
            <label>Observaciones</label>
            <textarea
              className="form-control"
              value={cabecera.observaciones}
              onChange={e => setCabecera({ ...cabecera, observaciones: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Acciones */}
      <button className="btn btn-success mb-3 me-2" onClick={() => setMostrarModal(true)}>➕ Agregar Tarea</button>
      <button
        className="btn btn-primary mb-3"
        onClick={finalizarParte}
        disabled={!cabecera.obra_id || !cabecera.equipo_id || detalle.length === 0}
      >
        ✅ Finalizar Parte
      </button>

      {/* Tabla de tareas */}
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Hora</th>
            <th>Horómetro</th>
            <th>Tarea</th>
          </tr>
        </thead>
        <tbody>
          {detalle.map((d, i) => {
            const tareaNombre = tareas.find(t => t.id === parseInt(d.tarea_id))?.nombre || '';
            return (
              <tr key={i}>
                <td>{d.hora}</td>
                <td>{d.horometro_km}</td>
                <td>{tareaNombre}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Modal de tarea */}
      {mostrarModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Agregar Tarea</h5>
                <button type="button" className="btn-close" onClick={() => setMostrarModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label>Horómetro</label>
                  <input
                    type="number"
                    className="form-control"
                    value={horometro}
                    onChange={e => setHorometro(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label>Tarea</label>
                  <select
                    className="form-select"
                    value={tareaId}
                    onChange={e => setTareaId(e.target.value)}
                  >
                    <option value="">-- Seleccionar tarea --</option>
                    {tareas.map(t => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setMostrarModal(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={agregarLinea}>Agregar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {mensaje && <div className="alert alert-info mt-3">{mensaje}</div>}
    </div>
  );
}
