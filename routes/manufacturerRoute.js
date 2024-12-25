const express = require('express');
const router = express.Router();
const { viewDashboard, viewAddProduct,addProduct, viewProducts, viewOneProduct, updateProduct, deleteProduct, 
        downloadQRcode, setThreshold, getThresholdForm, viewPaymentPage, createTransaction, storeWalletAddress, 
        receivedSignature, viewConfirmPayment} = require('../controllers/manufacturerController')
const upload = require('../middlewares/multer') 


router.get('/dashboard', viewDashboard);
router.get('/addProduct', viewAddProduct)
router.post('/addProduct', upload.single('productImage'), addProduct);
router.get('/product', viewProducts)
router.post('/updateProduct/:id', upload.single('productImage'), updateProduct);
router.post('/deleteProduct/:id', deleteProduct);
router.post('/product/:id', viewOneProduct)
router.get('/downloadQrcode/:id', downloadQRcode);
router.get('/setThreshold', getThresholdForm);
router.post('/setThreshold', setThreshold);
router.post('/pay', viewPaymentPage)
router.post('/makePayment', createTransaction)
router.post('/storeWalletAddress/:id', storeWalletAddress)
router.post('/signature', receivedSignature)
router.post('/confirmPayment',viewConfirmPayment )






module.exports = router;