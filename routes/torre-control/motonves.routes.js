const { Router } = require('express');
const MotonaveOperacionController = require('../../controllers/torre-control/motonave-operacion.controller');
const { validarJWT } = require("../../middlewares/validar-jwt");

const router = Router();

// router.get('/api/v1/motonaves/operacion', validarJWT, MotonaveOperacionController.listarOperaciones);

// router.post('/api/v1/motonaves/operacion', validarJWT, MotonaveOperacionController.crearOperacion);

router.post('/vincular', MotonaveOperacionController.vincularMotonave);

module.exports = router;