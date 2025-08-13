import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function CrearOrden() {
  const [obraId, setObraId] = useState('');
  const [equipoId, setEquipoId] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [kilometro, setKilometro] = useState('');
  const [horasUso, setHorasUso] = useState('');
  const [requiereRepuestos, setRequiereRepuestos] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
const [repuestos, setRepuestos] = useState([{ nombre: '', cantidad: 1 }]);
  const [mensaje, setMensaje] = useState('');
  const [obras, setObras] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const { usuario, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDatos = async () => {
      try {
        const resObras = await fetch(`${process.env.REACT_APP_API_URL}/obras`);
        const resEquipos = await fetch(`${process.env.REACT_APP_API_URL}/equipos`);
        const obrasData = await resObras.json();
        const equiposData = await resEquipos.json();
        setObras(obrasData);
        setEquipos(equiposData);
      } catch (error) {
        console.error('Error al cargar obras o equipos:', error);
      }
    };
    fetchDatos();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('Enviando...');

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/ordenes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          obra_id: Number(obraId),
          equipo_id: Number(equipoId),
          usuario_id: usuario.id,
          descripcion,
          kilometro: kilometro || null,
          horas_uso: horasUso || null,
          requiere_repuestos: requiereRepuestos ? 1 : 0,
          repuestos
          
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMensaje(`✅ Orden creada con ID: ${data.ordenId}`);
        setTimeout(() => navigate('/ordenes/lista'), 2000);
      } else {
        setMensaje(`❌ ${data.error} - ${data.detalle || ''}`);
      }
    } catch (error) {
      console.error(error);
      setMensaje('❌ Error al conectar con el servidor');
    }
  };

  return (
    <div className="container mt-5">
      <div className="card shadow p-4 mx-auto" style={{ maxWidth: '600px' }}>
        <h3 className="text-center mb-4">Crear Nueva Orden</h3>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Obra</label>
            <select className="form-select" value={obraId} onChange={(e) => setObraId(e.target.value)} required>
              <option value="">Seleccionar obra</option>
              {obras.map((obra) => (
                <option key={obra.id} value={obra.id}>
                  {obra.cod_obra} - {obra.nombre_obra}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Equipo</label>
            <select className="form-select" value={equipoId} onChange={(e) => setEquipoId(e.target.value)} required>
              <option value="">Seleccionar equipo</option>
              {equipos.map((equipo) => (
                <option key={equipo.id} value={equipo.id}>
                  {equipo.nombre_equipo} - {equipo.tipo}
                </option>
              ))}
            </select>
          </div>



          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Kilómetros</label>
              <input
                type="number"
                className="form-control"
                value={kilometro}
                onChange={(e) => setKilometro(e.target.value)}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Horas de uso</label>
              <input
                type="number"
                className="form-control"
                value={horasUso}
                onChange={(e) => setHorasUso(e.target.value)}
              />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">Trabajo a realizar</label>
            <textarea
              className="form-control"
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              required
            />
          </div>
            <div className="form-check mb-3">
              <input
                type="checkbox"
                className="form-check-input"
                checked={requiereRepuestos}
                onChange={(e) => {
                  setRequiereRepuestos(e.target.checked);
                  if (e.target.checked) setMostrarModal(true);
                }}
                id="repuestosCheck"
              />
              <label className="form-check-label" htmlFor="repuestosCheck">
                ¿Requiere repuestos?
              </label>
            </div>

          <button className="btn btn-primary w-100" type="submit">
            Crear Orden
          </button>
        </form>

        {mensaje && (
          <div className="alert alert-info text-center mt-3">{mensaje}</div>
        )}
      </div>
      {mostrarModal && (
  <div className="modal show d-block" tabIndex="-1">
    <div className="modal-dialog modal-lg">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Repuestos requeridos</h5>
          <button type="button" className="btn-close" onClick={() => setMostrarModal(false)}></button>
        </div>
        <div className="modal-body">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre del repuesto</th>
                <th>Cantidad</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {repuestos.map((item, i) => (
                <tr key={i}>
                  <td>
                    <input
                      type="text"
                      className="form-control"
                      value={item.nombre}
                      onChange={(e) => {
                        const nuevos = [...repuestos];
                        nuevos[i].nombre = e.target.value;
                        setRepuestos(nuevos);
                      }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="form-control"
                      value={item.cantidad}
                      onChange={(e) => {
                        const nuevos = [...repuestos];
                        nuevos[i].cantidad = Number(e.target.value);
                        setRepuestos(nuevos);
                      }}
                    />
                  </td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => {
                        const nuevos = repuestos.filter((_, index) => index !== i);
                        setRepuestos(nuevos);
                      }}
                    >
                      ❌
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            className="btn btn-secondary"
            onClick={() => setRepuestos([...repuestos, { nombre: '', cantidad: 1 }])}
          >
            + Agregar repuesto
          </button>
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={() => setMostrarModal(false)}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  </div>
)}

    </div>
    
  );
}
