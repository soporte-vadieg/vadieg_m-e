const express = require('express');
const router = express.Router();
const partesController = require('../controllers/partes.controller');

router.post('/', partesController.crearParte);
router.post('/:parte_id/detalle', partesController.agregarDetalle);
router.get('/tareas', partesController.listarTareas);
router.get('/lista', partesController.listaPartes);

// 👇 NUEVO: tareas del parte (lo que pide tu frontend)
router.get('/lista/:id', partesController.listaTareasPorParte);

module.exports = router;
