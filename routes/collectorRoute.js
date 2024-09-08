const express = require('express');
const router = express.Router();
const { collectSubmission , viewDashboard, searchSubmissions} = require('../controllers/collectorController')

router.post('/scan', collectSubmission);
router.get('/dashboard', viewDashboard);
router.get('/points', searchSubmissions)








module.exports = router;