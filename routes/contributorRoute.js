const express = require('express');
const router = express.Router();
const { getProducts, addWallet, searchSubmissions, getHistoryContributor } = require('../controllers/contributorController')


router.post('/getProducts', getProducts)
router.post('/walletDetails/:id', addWallet)
router.post('/search', searchSubmissions)
router.post('/history', getHistoryContributor)






module.exports = router;