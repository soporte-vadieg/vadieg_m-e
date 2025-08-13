const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // 👈 agregá esto

const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const [result] = await pool.execute(
      'SELECT * FROM usuarios WHERE username = ?',
      [username]
    );

    if (result.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const usuario = result[0];
    const match = await bcrypt.compare(password, usuario.password);

    if (!match) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

// ✅ Crear el token con role y permisos
const token = jwt.sign(
  {
    id: usuario.id,
    username: usuario.username,
    role: usuario.role,
    permisos: usuario.permisos // si es CSV, se envía así y el backend lo parsea
  },
  process.env.JWT_SECRET,
  { expiresIn: '12h' } // más tiempo si querés
);

    // ✅ Devolver token + datos del usuario
    res.json({
      token,
      user: {
        id: usuario.id,
        full_name: usuario.full_name,  // <- Cambiado aquí
        email: usuario.email,
        area: usuario.area,
        username: usuario.username,
        role: usuario.role,  // Puedes devolver el rol si lo necesitas
        permisos: usuario.permisos

      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { login };
