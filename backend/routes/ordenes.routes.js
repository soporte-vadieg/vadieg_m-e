const express = require('express');
const router = express.Router();
const { crearOrden, listarOrdenes ,cambiarEstadoOrden} = require('../controllers/ordenes.controller');
const verificarToken = require('../middleware/auth');

// Crear una orden (POST)
router.post('/', verificarToken, crearOrden);

// Listar todas las órdenes (GET)
router.get('/lista', verificarToken, listarOrdenes);

// PATCH /ordenes/:id/estado
router.patch('/:id/estado', verificarToken, cambiarEstadoOrden);


module.exports = router;
