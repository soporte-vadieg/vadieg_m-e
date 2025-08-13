const db = require('../db');

exports.listarObras = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT id, nombre_obra FROM obras');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener obras' });
  }
};
