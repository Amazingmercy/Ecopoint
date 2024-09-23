const express = require('express');
const router = express.Router();
const { getProducts, editProfile, searchSubmissions, getHistoryContributor } = require('../controllers/contributorController')


router.post('/getProducts', getProducts)
router.post('/bankdetails/:id', editProfile)
router.post('/search', searchSubmissions)
router.post('/history', getHistoryContributor)






module.exports = router;