const express = require('express');
const router = express.Router();
const { getProducts, editProfile, searchSubmissions } = require('../controllers/contributorController')


router.post('/getProducts', getProducts)
router.post('/bankdetails/:id', editProfile)
router.post('/search', searchSubmissions)






module.exports = router;