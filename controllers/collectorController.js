const express = require('express');
const router = express.Router();
const Submission = require('../models/submissionModel');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const Points = require('../models/pointsModel'); 
const QRcode = require('../models/qrCodeModel')

const viewDashboard = async (req, res) => {
    try{
        res.render('collector/dashboard', { error: "", message: "", manufacturer:"",
            product: "",
            totalPointsFromManufacturer: ""})
    } catch (error) {
        res.status(400).json({message: 'Error rendering Collector Dashboard'})
    }
}




const collectSubmission = async (req, res) => {
    const { contributorEmail, productQrCode } = req.body;
    const collector = await User.findOne({ email: req.user.email });
    // Extract productId from the uniqueCode
    const productId = productQrCode.split('-')[0];
    

    try {

        // Check if the QR code exists in the database
        const existingQRCode = await QRcode.findOne({ uniqueCode: productQrCode });
    

        if (!existingQRCode) {
            return res.render('collector/dashboard', { message: 'QR Code not found', manufacturer:"",
                product: "",
                totalPointsFromManufacturer: "" });
        }

        // Check if the QR code has already been scanned
        if (existingQRCode.scanned) {
            return res.render('collector/dashboard', { message: 'QR Code has already been scanned', manufacturer:"",
                product: "",
                totalPointsFromManufacturer: "" });
        }

       
        const contributor = await User.findOne({ email: contributorEmail, role: 'contributor' });
        if (!contributor) {
            return res.render('collector/dashboard',{ message: 'Contributor not found', manufacturer:"",
                product: "",
                totalPointsFromManufacturer: "" });
        }

         // Find the product and its manufacturer
         const product = await Product.findById(productId).populate('manufacturer');
         if (!product) {
             return res.render('collector/dashboard',{ message: 'Product not found', manufacturer:"",
                product: "",
                totalPointsFromManufacturer: "" });
         }
 
         const contributorPoints = product.points * 0.70; // 70% for the contributor
         const collectorPoints = product.points * 0.30; // 30% for the contributor


        // Create a new submission for the contributor
        await Submission.create({
            product_id: product._id,
            contributor_id: contributor._id,
            productName: product.productName,
            productPoint: product.points,
            collector_id: collector._id
        });

        // Update or create points for the contributor
        await Points.updateOne(
            { user: contributor._id, manufacturer: product.manufacturer },
            { $inc: { totalPoints: contributorPoints } },  // Increment totalPoints by product.points
            { upsert: true }  // Create a new entry if it doesn't exist
        );

        // Increment the collector's points (assumed to be a field in the User model)
        await Points.updateOne(
            { user: collector._id, manufacturer: product.manufacturer },
            { $inc: { totalPoints: collectorPoints } }, // Increment points for the collector
            { upsert: true }  // Create a new entry if it doesn't exist
        );

        // Update the QR code as scanned
        await QRcode.updateOne({ uniqueCode: existingQRCode.uniqueCode }, { scanned: true });
        // Respond with a success message
        res.render('collector/dashboard', {
            manufacturer: product.manufacturer.name,
            product: product.productName,
            totalPointsFromManufacturer: product.points,
            message: 'Product successfully scanned and points awarded',
            error: ''
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};



const searchSubmissions = async (req, res) => {
    const email = req.user.email;


    try {
        // Find the collector (user) by email
        const collector = await User.findOne({ email: email, role: 'collector' });
        if (!collector) {
            return res.render(`collector/dashboard`, { submissions: [], collector, message: 'Collector not found' });
        }

        // Find points accumulated by this contributor from different manufacturers
        const points = await Points.find({ user: collector._id }).populate('manufacturer');  // Populating manufacturer details

        // If no points are found, display a message
        if (points.length === 0) {
            return res.render(`collector/points`, { submissions: [], collector, message: 'No points found for this email' });
        }

        // Prepare a response with manufacturers and corresponding points
        const submissions = points.map(point => ({
            manufacturerName: point.manufacturer.name,  // Assuming the manufacturer has a 'name' field
            totalPoints: point.totalPoints
        }));

        // Render the response
        res.render('collector/points', { submissions, collector , message: ""});
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
}



const getHistory = async (req, res) => {
    try {
        // Get contributor ID from request parameters
        const collectorEmail = req.user.email;

        const collector = await User.findOne({ email: collectorEmail, role: 'collector' });

        if (!collector) {
            return res.render(`collector/history`, { submissions: [], currentPage: 1, totalPages: 1, message: 'collector not found' });
        }

        // Get collector ID
        const collectorId = collector._id;

        // Pagination parameters
        const page = parseInt(req.query.page) || 1; // Current page number, default to 1
        const limit = 10; // Number of submissions per page
        const skip = (page - 1) * limit; // Calculate number of documents to skip

        // Find all submissions made by this contributor with pagination
        const submissions = await Submission.find({ collector_id: collelctorId })
            .populate('product_id', 'productName productPoint')
            .populate('collector_id', 'name') // Populate collector's name
            .skip(skip)
            .limit(limit);

        // Count total submissions for pagination
        const totalSubmissions = await Submission.countDocuments({ collector_id: collectorId });
        const totalPages = Math.ceil(totalSubmissions / limit);

        // Render the history view and pass the submissions and pagination data
        res.render('history', { submissions, currentPage: page, totalPages });
    } catch (err) {
        console.error('Error fetching submission history:', err);
        res.status(500).send('Internal Server Error');
    }
};


module.exports ={
    collectSubmission,
    viewDashboard,
    searchSubmissions,
    getHistory,
};
