const Product = require('../models/productModel')
const User = require('../models/userModel')
const Points = require('../models/pointsModel');
const QRcode = require('../models/qrCodeModel')
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises'); // Use pipeline from the stream module
const axios = require('axios')
const archiver = require('archiver')
const qrCode = require('qrcode')
const bs58 = require('bs58')
const { Connection, PublicKey, Transaction, SystemProgram } = require('@solana/web3.js');



const viewDashboard = async (req, res) => {
    try {
        const manufacturerId = req.user.userId;
        const manufacturerObjectId = new mongoose.Types.ObjectId(manufacturerId);

        // Fetch total products created by this manufacturer
        const totalProducts = await Product.countDocuments({ manufacturer: manufacturerId });

        // Fetch total contributors and collectors who have points from this manufacturer
        const pointsData = await Points.find({ manufacturer: manufacturerId })
            .populate({
                path: 'user',
                select: 'role name email walletDetails.walletAddress'  // Select required fields for user
            });

        // Separate contributors and collectors
        const contributors = pointsData.filter(points => points.user.role === 'contributor');
        const collectors = pointsData.filter(points => points.user.role === 'collector');

        const totalContributors = contributors.length;
        const totalCollectors = collectors.length;

        // Calculate total points distributed by this manufacturer
        const totalPoints = await Points.aggregate([
            {
                $match: { manufacturer: manufacturerObjectId }
            },
            {
                $group: {
                    _id: "$manufacturer",  // Group by the manufacturer field
                    totalPoints: { $sum: "$totalPoints" }  // Sum the totalPoints for this manufacturer
                }
            }
        ]);

        const pointsDistributed = totalPoints.length > 0 ? totalPoints[0].totalPoints : 0;

        // Fetch the manufacturer's payment threshold
        const manufacturer = await User.findById(manufacturerId);
        const threshold = manufacturer.paymentThreshold;

        // Check if any contributors or collectors have reached the payment threshold
        let usersToPay = [];
        for (const points of pointsData) {
            if (points.totalPoints >= threshold) {
                usersToPay.push({
                    userName: points.user.name,
                    userEmail: points.user.email,
                    walletAddress: points.user.walletDetails.walletAddress,
                    totalPoints: points.totalPoints,
                    manufacturerId: points.manufacturer,
                    role: points.user.role , // Role can be 'contributor' or 'collector'
                    id: points.user._id
                });
            }
        }

        

        // Render the dashboard with the retrieved data, including threshold notifications
        res.render('manufacturer/dashboard', {
            totalProducts,
            totalContributors,
            totalCollectors,
            pointsDistributed,
            usersToPay,  // Pass the list of contributors and collectors who reached the threshold
            showPaymentOption: usersToPay.length > 0,  // Show "Pay Now" button if there are users to pay
            error: "",
            message: usersToPay.length > 0
                ? 'The following users have reached the payment threshold. You can now make payments.'
                : ""
        });
    } catch (error) {
        console.log(error);
        res.status(400).json({ message: 'Error rendering Manufacturer Dashboard' });
    }
};



const viewAddProduct = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.user.email });
        res.render('manufacturer/addProduct', { user, token: req.user.token, error: "", message: "" })
    } catch (error) {
        res.status(400).json({ message: 'Error rendering addProduct view' })
    }
}


const addProduct = async (req, res) => {
    const user = await User.findOne({ email: req.user.email });
    const userId = user._id;

    if (req.user.role !== 'manufacturer') {
        return res.status(403).json({ error: 'Only manufacturers can create products.' });
    }

    try {
        const { productName, category, points } = req.body;
        const productImage = req.file ? req.file.filename : null;

        await Product.create({
            userId: userId,
            productName: productName,
            category: category,
            points: parseFloat(points),
            productImage: productImage,
            manufacturer: userId
        });

        const products = await Product.find({ manufacturer: userId }).select('productName category points productImage')
        res.render('manufacturer/viewAllProducts', { products, error: "", message: "", user });;
    } catch (error) {
        res.status(400).json({ message: 'Error adding product' });
    }
};

const viewProducts = async (req, res) => {

    const user = await User.findOne({ email: req.user.email });
    const products = await Product.find({ manufacturer: user._id }).select('productName category points productImage')



    res.render('manufacturer/viewAllProducts', {
        user,
        products,
        token: req.user.token,
        message: "",
        error: ""
    });
}


const viewOneProduct = async (req, res) => {

    const user = await User.findOne({ email: req.user.email });
    const productId = req.params.id
    const product = await Product.findOne({ _id: productId }).select('productName category points productImage')



    const qrCode = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + productId;
    res.render('manufacturer/viewProduct', {
        user,
        product,
        qrCode,
        token: req.user.token,
        message: "",
        error: ""
    });
}


const updateProduct = async (req, res) => {
    const user = await User.findOne({ email: req.user.email })
    try {
        const { productName, points, category } = req.body;
        const productId = req.params.id;
        const updateData = {
            productName: productName,
            points: parseFloat(points),
            category: category,
        };

        if (req.file) {
            updateData.productImage = req.file.filename;
        }

        await Product.findOneAndUpdate(
            { _id: productId, manufacturer: user._id },
            { $set: updateData }
        );


        res.redirect('/manufacturer/product');
    } catch (error) {
        res.render('product', { error: error.message, message: "" });
    }
};



const deleteProduct = async (req, res) => {
    const user = await User.findOne({ email: req.user.email })
    const productId = req.params.id

    try {
        await Product.findOneAndDelete({ _id: productId, manufacturer: user._id });
        res.redirect('/manufacturer/product');
    } catch (error) {
        res.render('manufacturer/viewAllProducts', { error: error.message, message: "" });
    }
};

//Generate Qr code which is same for product
const downloadSingleQRcode = async (req, res) => {
    try {
        const productId = req.params.id;

        // Generate the QR code URL
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${productId}`;

        // Path to save the QR code temporarily
        const qrCodeFilePath = path.join(__dirname, '..', 'static', 'qrCodes', `${productId}-qrcode.png`);

        // Download the QR code and save it locally using stream pipeline
        const response = await axios({
            url: qrCodeUrl,
            method: 'GET',
            responseType: 'stream'
        });

        // Use the pipeline method to handle stream with async/await
        await pipeline(response.data, fs.createWriteStream(qrCodeFilePath));

        // Once the file is saved, send it to the client for download
        res.download(qrCodeFilePath, `${productId}-qrcode.png`, async (err) => {
            if (err) {
                console.log('Error downloading QR code:', err);
                return res.status(500).send('Error downloading QR code');
            }

            // Optionally, delete the file after it's been downloaded
            try {
                await fs.promises.unlink(qrCodeFilePath);
            } catch (unlinkErr) {
                console.log('Error deleting QR code file:', unlinkErr);
            }
        });

    } catch (error) {
        console.log('Error generating QR code download:', error);
        res.status(500).json({ message: 'Error generating QR code download' });
    }
};


//Generate unique Qr codes for same product
const downloadQRcode = async (req, res) => {
    try {
        const productId = req.params.id;
        const numberOfCodes = parseInt(req.query.amount, 10); // Assuming the amount is passed as a query parameter
        if (isNaN(numberOfCodes) || numberOfCodes <= 0) {
            return res.status(400).json({ message: 'Invalid amount provided' });
        }

        // Array to store the paths of the generated QR codes
        const qrCodePaths = [];

        // Loop to generate multiple QR codes
        for (let i = 0; i < numberOfCodes; i++) {
            // Create a unique string for each QR code (e.g., append a counter or timestamp)
            const uniqueCode = `${productId}-${i}-${Date.now()}`;

            // Generate the QR code URL
            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${uniqueCode}`;

            // Path to save each QR code temporarily
            const qrCodeFilePath = path.join(__dirname, '..', 'static', 'qrCodes', `${uniqueCode}-qrcode.png`);

            // Download the QR code and save it locally using stream pipeline
            const response = await axios({
                url: qrCodeUrl,
                method: 'GET',
                responseType: 'stream'
            });

            // Use the pipeline method to handle the stream with async/await
            await pipeline(response.data, fs.createWriteStream(qrCodeFilePath));

            // Add the file path to the array
            qrCodePaths.push(qrCodeFilePath);

            // Save the QR code to the database using `create()`
            await QRcode.create({
                productId: productId,
                uniqueCode: uniqueCode
            });
        }

        // Create a zip file to bundle all QR codes for download
        const zipFilePath = path.join(__dirname, '..', 'static', 'qrCodes', `${productId}-qrcodes.zip`);
        const zip = archiver('zip', {
            zlib: { level: 9 } // Compression level
        });

        const output = fs.createWriteStream(zipFilePath);
        zip.pipe(output);

        // Add all generated QR codes to the zip archive
        qrCodePaths.forEach(filePath => {
            zip.file(filePath, { name: path.basename(filePath) });
        });

        // Finalize the zip archive
        await zip.finalize();

        // Once the zip is created, send it to the client for download
        output.on('close', async () => {
            res.download(zipFilePath, `${productId}-qrcodes.zip`, async (err) => {
                if (err) {
                    console.log('Error downloading QR codes:', err);
                    return res.status(500).send('Error downloading QR codes');
                }

                // Optionally, delete the zip and the QR code files after downloading
                try {
                    await fs.promises.unlink(zipFilePath); // Delete the zip file
                    for (const filePath of qrCodePaths) {
                        await fs.promises.unlink(filePath); // Delete each QR code file
                    }
                } catch (unlinkErr) {
                    console.log('Error deleting QR code files:', unlinkErr);
                }
            });
        });

    } catch (error) {
        console.log('Error generating QR code download:', error);
        res.status(500).json({ message: 'Error generating QR code download' });
    }
};



// Render the form to set the threshold
const getThresholdForm = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.user.email });
        const threshold = user.paymentThreshold || 0;  // Fetch existing threshold if available
        res.render('manufacturer/settings', { user, threshold, message: "", error: "" });
    } catch (error) {
        console.log(error);
        res.status(500).render('manufacturer/settings', { user: req.user, threshold: 0, message: "", error: "Error loading form" });
    }
};

// Handle threshold form submission
const setThreshold = async (req, res) => {
    try {
        const { threshold } = req.body;

        // Validate threshold input
        if (isNaN(threshold) || threshold <= 0) {
            return res.render('manufacturer/settings', {
                user: req.user,
                threshold,
                message: "",
                error: "Please enter a valid threshold value."
            });
        }

        // Update the threshold for the manufacturer
        await User.updateOne(
            { email: req.user.email },
            { $set: { paymentThreshold: parseInt(threshold, 10) } }
        );

        res.render('manufacturer/settings', {
            user: req.user,
            threshold,
            message: "Threshold set successfully!",
            error: ""
        });
    } catch (error) {
        console.log(error);
        res.status(500).render('manufacturer/settings', {
            user: req.user,
            threshold: 0,
            message: "",
            error: "Error saving threshold"
        });
    }
};

const storeWalletAddress = async (req, res) => {
    const userId = req.params.id

    const { walletAddress} = req.body;
    try {

        const newUser = await User.findOneAndUpdate(
            { _id: userId, role: { $in: ['manufacturer'] } },
            {
                $set: {
                    walletDetails: {
                        walletAddress: walletAddress
                    }
                }
            },
            { new: true }
        );
        res.redirect('/login')
    } catch (error) {
        console.log(error)
        res.status(400).json({ message: 'Error rendering Dashboard' })
    }

}


const viewPaymentPage = async (req, res) => {
    try {
        const { userId, userName, publicKey, amount, manufacturerId } = req.body;
        res.render('manufacturer/pay', {
            userId,       
            userName,     
            publicKey,    
            amount,
            manufacturerId  
        });
    } catch (error) {
        console.log('Error rendering payment page:', error);
        res.status(500).json({ message: 'Error rendering payment page' });
    }
};


const createTransaction = async (req, res) => {
    const { userName, amount, recipientPublicKey, manufacturerPublicKey } = req.body;
    const amountInLamports = amount * 1_000_000_000;
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  
    try { 
        res.status(200).json({userName, amountInLamports});
      // window.location.href = 'manufacturer/signTransaction';
      // sessionStorage.setItem('transactionResponse', JSON.stringify(transactionResponse));
      } catch (error) {
          console.log('Error rendering payment page:', error);
          res.status(500).json({ message: 'Error rendering payment page' });
      }
    };




    const viewConfirmPayment = async (req, res) => {
        try {
            const { amount, userName, userId, manufacturerId } = req.body; 
    
            // Update totalPoints to zero in the Points collection
            await Points.updateOne(
                { user: userId, manufacturer: manufacturerId }, // Filter to find the specific user's points entry
                { totalPoints: 0 } // Update totalPoints to zero
            );
            // Render the confirmation page
            res.render('manufacturer/confirmPayment', {
                amount,
                userName
            });
            
            
        } catch (error) {
            console.log('Error updating points:', error);
            // Handle error (optional: render an error page or return a response)
            res.status(500).send('An error occurred while processing your request.');
        }
    };

  const receivedSignature = async (req, res) => {
    const { signedTransaction } = req.body;
    const transaction = signedTransaction.serialize().toString('hex')
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  
    try {
      const signature = await connection.sendRawTransaction(transaction);
  
      res.json({ signature });
    } catch (error) {
      console.log('Error sending transaction:', error);
      res.status(500).json({
        message: 'Transaction failed. Please try again.',
        success: false,
      });
    }
  };






module.exports = {
    viewDashboard,
    viewAddProduct,
    addProduct,
    viewProducts,
    deleteProduct,
    updateProduct,
    viewOneProduct,
    downloadQRcode,
    getThresholdForm,
    setThreshold,
    viewPaymentPage,
    createTransaction,
    receivedSignature,
    storeWalletAddress,
    viewConfirmPayment
}