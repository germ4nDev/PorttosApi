/*
    Author: German Valencia
    Refactored for: QPLUS Standard - Router de Infraestructura
*/
const express = require('express');
const router = express.Router();
const { validarJWT } = require("../../middlewares/validar-jwt");
const {
  getInfraestructuras,
  getInfraestructuraById,
  crearInfraestructura,
  updateInfraestructura,
  deleteInfraestructura
} = require("../../controllers/torre-control/infraestructura.controller");

router.get('/', getInfraestructuras);

// CORRECCIÓN: Cambiamos :id por :id_infraestructura para que coincida con el controlador
router.get('/:id_infraestructura', [validarJWT], getInfraestructuraById);

router.post('/', [validarJWT], crearInfraestructura);

// CORRECCIÓN: Actualizamos también aquí
router.put('/:id_infraestructura', [validarJWT], updateInfraestructura);

// CORRECCIÓN: Actualizamos también aquí
router.delete('/:id_infraestructura', [validarJWT], deleteInfraestructura);

module.exports = router;