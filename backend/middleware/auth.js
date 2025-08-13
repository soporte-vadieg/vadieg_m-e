const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
  const auth = req.headers['authorization'] || req.headers['Authorization'];
  if (!auth) return res.status(401).json({ error: 'Falta header Authorization' });

  const [scheme, token] = auth.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Formato Authorization inválido' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Token inválido o expirado' });

    req.user = decoded; // 👈 usar SIEMPRE req.user
    // 🔍 Log mínimo para depurar (sacalo en prod)
    console.log('🔐 JWT ok:', { id: decoded.id, username: decoded.username });
    next();
  });
}

module.exports = verificarToken;
