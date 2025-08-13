const express = require('express');
const router = express.Router();
const { registrarUsuario, loginUsuario ,obtenerUsuarios} = require('../controllers/usuarios.controller');
const verifyToken = require('../middleware/auth'); // Middleware de auth

// POST /api/usuarios/registro
router.post('/',verifyToken, registrarUsuario);

// POST /api/usuarios/login
router.post('/login', loginUsuario);

//Obtener usuarios
router.get('/lista', verifyToken, obtenerUsuarios);


module.exports = router;
