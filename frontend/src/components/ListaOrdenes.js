import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ListaOrdenes() {
  const { token } = useAuth();
  const [ordenes, setOrdenes] = useState([]);
  const [mensaje, setMensaje] = useState('');

  const fetchOrdenes = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/ordenes/lista`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOrdenes(data);
    } catch (error) {
      console.error(error);
      setMensaje('❌ Error al obtener las órdenes');
    }
  }, [token]);

  useEffect(() => {
    fetchOrdenes();
  }, [fetchOrdenes]);

  const handleEstadoChange = async (id, nuevoEstado) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/ordenes/${id}/estado`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      // Refrescar lista
      fetchOrdenes();
    } catch (error) {
      console.error(error);
      alert('❌ No se pudo actualizar el estado.');
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Órdenes de Servicio</h2>
      {mensaje && <div className="alert alert-danger">{mensaje}</div>}
      {ordenes.length === 0 ? (
        <p className="text-center">No hay órdenes registradas.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-hover shadow-sm">
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Descripción</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Usuario</th>
                <th>Obra</th>
                <th>Equipo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {ordenes.map((orden) => (
                <tr key={orden.id}>
                  <td>{orden.id}</td>
                  <td>{orden.descripcion}</td>
                  <td>{orden.hora_inicio ? new Date(orden.hora_inicio).toLocaleString() : '-'}</td>
                  <td>{orden.hora_fin ? new Date(orden.hora_fin).toLocaleString() : '-'}</td>
                  <td>{orden.nombre_usuario}</td>
                  <td>{orden.nombre_obra}</td>
                  <td>{orden.nombre_equipo}</td>
                  <td>
                    <select
                      className={`form-select form-select-sm ${
                        orden.estado === 'cerrada' ? 'bg-success text-white' :
                        orden.estado === 'pausada' ? 'bg-warning text-dark' :
                        'bg-primary text-white'
                      }`}
                      value={orden.estado}
                      onChange={(e) => handleEstadoChange(orden.id, e.target.value)}
                    >
                      <option value="abierta">Abierta</option>
                      <option value="pausada">Pausada</option>
                      <option value="cerrada">Cerrada</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
