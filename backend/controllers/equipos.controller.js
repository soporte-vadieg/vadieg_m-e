const db = require('../db');

// ✅ Lista todos los equipos o filtra por tipo
exports.listarEquipos = async (req, res) => {
  try {
    const { tipo } = req.query;
    let query = 'SELECT id, nombre_equipo, tipo, descripcion FROM equipos';
    const params = [];

    if (tipo) {
      query += ' WHERE tipo = ?';
      params.push(tipo);
    }

    query += ' ORDER BY nombre_equipo ASC';

    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener equipos:', error);
    res.status(500).json({ error: 'Error al obtener equipos' });
  }
};

// ✅ Lista tipos únicos
exports.listarTiposEquipos = async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT DISTINCT tipo FROM equipos WHERE tipo IS NOT NULL AND tipo <> "" ORDER BY tipo ASC'
    );
    res.json(rows.map(r => r.tipo));
  } catch (error) {
    console.error('Error al obtener tipos de equipos:', error);
    res.status(500).json({ error: 'Error al obtener tipos de equipos' });
  }
};

// ✅ Obtiene un equipo por su ID
exports.obtenerEquipoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.execute(
      'SELECT id, nombre_equipo, tipo, descripcion FROM equipos WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener equipo:', error);
    res.status(500).json({ error: 'Error al obtener equipo' });
  }
};
