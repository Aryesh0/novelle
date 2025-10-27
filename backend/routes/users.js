const express = require('express');
const router = express.Router();
const userController = require('../controllers/usercontroller');

router.post('/auth/register', userController.register);
router.post('/auth/login', userController.login);

module.exports = router;