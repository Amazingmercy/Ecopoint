const express = require('express');
const router = express.Router();
const Submission = require('../models/submissionModel');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const Points = require('../models/pointsModel'); 

const viewDashboard = async (req, res) => {
    try{
        res.render('collector/dashboard', { error: "", message: ""})
    } catch (error) {
        res.status(400).json({message: 'Error rendering Collector Dashboard'})
    }
}




const collectSubmission = async (req, res) => {
    const { contributorEmail, productQrCode } = req.body;
    const collector = await User.findOne({ email: req.user.email });

    const collectorId = collector._id
    

    try {
       
        const contributor = await User.findOne({ email: contributorEmail, role: 'contributor' });
        if (!contributor) {
            return res.status(200).json({ message: 'Contributor not found' });
        }

        // Decode the QR code (for now using it directly as productId)
        const productId = productQrCode;

        // Find the product and its manufacturer
        const product = await Product.findById(productId).populate('manufacturer');
        if (!product) {
            return res.status(200).json({ message: 'Product not found' });
        }

        // Create a new submission for the contributor
        await Submission.create({
            product_id: product._id,
            contributor_id: contributor._id,
            productName: product.productName,
            productPoint: product.points
        });

        // Update or create points for the contributor
        await Points.updateOne(
            { user: contributor._id, manufacturer: product.manufacturer },
            { $inc: { totalPoints: product.points } },  // Increment totalPoints by product.points
            { upsert: true }  // Create a new entry if it doesn't exist
        );

        // Calculate the 2% of points for the collector (collector's ID is from the token)
        const collectorBonusPoints = product.points * 0.02;

        // Increment the collector's points (assumed to be a field in the User model)
        await Points.updateOne(
            { user: collectorId, manufacturer: product.manufacturer },
            { $inc: { totalPoints: collectorBonusPoints } }, // Increment points for the collector
            { upsert: true }  // Create a new entry if it doesn't exist
        );

        // Respond with a success message
        res.status(200).json({
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
        // Find the contributor (user) by email
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


module.exports ={
    collectSubmission,
    viewDashboard,
    searchSubmissions,
};
