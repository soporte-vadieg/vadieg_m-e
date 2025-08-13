const pool = require('../db');

const crearOrden = async (req, res) => {
  const {
    obra_id,
    equipo_id,
    descripcion,
    usuario_id,
    estado = 'abierta',
    kilometro,
    horas_uso,
    requiere_repuestos = false,
    repuestos = []
  } = req.body;

  const fecha = new Date().toISOString().slice(0, 10);
  const hora_inicio = new Date().toISOString().slice(0, 19).replace('T', ' ');

  if (!obra_id || !equipo_id || !usuario_id || !descripcion) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO ordenes_servicio 
        (obra_id, equipo_id, usuario_id, descripcion, fecha, hora_inicio, kilometro, horas_uso, estado, requiere_repuestos)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        obra_id,
        equipo_id,
        usuario_id,
        descripcion,
        fecha,
        hora_inicio,
        kilometro || null,
        horas_uso || null,
        estado,
        requiere_repuestos ? 1 : 0
      ]
    );

    const ordenId = result.insertId;

    if (requiere_repuestos && repuestos.length > 0) {
      const insertPromises = repuestos.map(r =>
        pool.execute(
          `INSERT INTO repuestos_orden (orden_id, nombre, cantidad) VALUES (?, ?, ?)`,
          [ordenId, r.nombre, r.cantidad]
        )
      );
      await Promise.all(insertPromises);
    }

    res.status(201).json({ message: 'Orden creada exitosamente', ordenId });
  } catch (error) {
    console.error('Error al crear orden:', error);
    res.status(500).json({ error: 'Error al crear orden de servicio', detalle: error.message });
  }
};
const listarOrdenes = async (req, res) => {

  try {
    const user = req.user || {};
    const idUsuario = user.id;

    // role robusto a mayúsculas / undefined
    const rol = (user.role || '').toString().trim().toLowerCase();
  console.log('req.user =', req.user);
    // permisos puede venir array o CSV string → normalizamos a array en minúsculas
    let permisos = [];
    if (Array.isArray(user.permisos)) {
      permisos = user.permisos.map(p => (p || '').toString().trim().toLowerCase());
    } else if (typeof user.permisos === 'string') {
      permisos = user.permisos
        .split(',')
        .map(p => p.trim().toLowerCase())
        .filter(Boolean);
    }

    const isAdmin = rol === 'admin' || permisos.includes('admin') || permisos.includes('ordenes:ver_todas');

    let query = `
      SELECT 
        o.id,
        o.descripcion,
        o.hora_inicio,
        o.hora_fin,
        o.estado,

        ob.id AS obra_id,
        ob.cod_obra,
        ob.nombre_obra,

        eq.id AS equipo_id,
        eq.nombre_equipo,
        eq.tipo AS tipo_equipo,

        u.id AS usuario_id,
        u.username AS nombre_usuario,
        u.full_name

      FROM ordenes_servicio o
      JOIN obras   ob ON o.obra_id   = ob.id
      JOIN equipos eq ON o.equipo_id = eq.id
      JOIN usuarios u ON o.usuario_id = u.id
    `;

    const params = [];

    // Solo filtro por usuario si NO es admin
    if (!isAdmin) {
      query += ' WHERE o.usuario_id = ?';
      params.push(idUsuario);
    }

    query += ' ORDER BY o.id DESC';

    const [ordenes] = await pool.execute(query, params);
    res.json(ordenes);
  } catch (error) {
    console.error('Error al listar órdenes:', error);
    res.status(500).json({ error: 'Error al obtener las órdenes' });
  }
};

const cambiarEstadoOrden = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  try {
    let query = 'UPDATE ordenes_servicio SET estado = ?';
    const params = [estado];

    if (estado === 'cerrada') {
      query += ', hora_fin = NOW()'; // ✅ Actualiza hora de cierre
    }

    query += ' WHERE id = ?';
    params.push(id);

    await pool.execute(query, params);

    res.json({ mensaje: 'Estado actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cambiar el estado' });
  }
};
module.exports = {
  crearOrden, listarOrdenes,cambiarEstadoOrden
};
