const express = require('express');
const router = express.Router();
const {viewHome, viewLogin, register, login, logout, viewRegister} = require('../controllers/authController')


router.get('/', viewHome);
router.get('/login', viewLogin)
router.get('/register', viewRegister)
router.post('/register', register)
router.post('/login', login)
router.get('/logout', logout)




module.exports = router;