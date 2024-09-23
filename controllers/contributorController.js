const Product = require('../models/productModel')
const User = require('../models/userModel')
const Submission = require('../models/submissionModel')
const Points = require('../models/pointsModel')
const secretKey = process.env.JWT_SECRET_KEY;
const jwt = require('jsonwebtoken')





const getProducts = async (req, res) => {
    try {
        const email = req.body.email;
        let emailSubmitted = true;

        if (!email) {
            return res.render('dashboard', { message: "", products: [], emailSubmitted: false });
        }

        // Check if the user is a contributor
        const contributor = await User.findOne({ email: email, role: 'contributor' });
        if (!contributor) {
            return res.render('contributor/dashboard', { products: [], emailSubmitted, message: "User is not registered as a contributor", error: "" });
        }

        // Find all submissions by the contributor
        const submissions = await Submission.find({ contributor_id: contributor._id });

        if (submissions.length === 0) {
            return res.render('contributor/dashboard', { products: [], emailSubmitted, message: "No contributions made", error: "" });
        }

        // Get all products related to the submissions
        const productIds = submissions.map(submission => submission.product_id);
        const products = await Product.find({ _id: { $in: productIds } });

        res.render('contributor/dashboard', { products, emailSubmitted, message: "", error: "" });
    } catch (error) {
        res.status(400).json({ message: 'Error rendering Contributor Dashboard' });
    }
}

const editProfile = async (req, res) => {
    const userId = req.params.id

    const { bankName, accountNumber, accountName } = req.body;

    try {

        const newUser = await User.findOneAndUpdate(
            { _id: userId, role: { $in: ['contributor', 'collector'] } },
            {
                $set: {
                    bankDetails: {
                        bankName,
                        accountNumber,
                        accountName
                    }
                }
            },
            { new: true }
        );

        const manufacturers = await User.find({ role: 'manufacturer' }).select('name');
        const collectors = await User.find({ role: 'collector' }).select('name address');

        //To send Token when user logs in
        const payload = {
            userId: newUser._id,
            userEmail: newUser.email,
            userRole: newUser.role,
          };
        
          
          const token =  jwt.sign(payload, secretKey, { expiresIn: '100m' });
          res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
          });

        if (newUser.role == 'contributor') {
            // Render the landing page with the manufacturers and collectors data
            res.render('landing', {
                manufacturers,
                collectors,
                error: "",
                newUser,
                message: "Bank details updated successfully!"
            });
        } else {
            res.render('collector/dashboard', { message: 'Bank details updated successfully!', token , newUser});
        }
    } catch (error) {
        console.log(error)
        res.status(400).json({ message: 'Error rendering Landing page Dashboard' })
    }
}

const searchSubmissions = async (req, res) => {
    const email = req.body.email;

    try {
        // Find the contributor (user) by email
        const contributor = await User.findOne({ email: email, role: 'contributor' });
        if (!contributor) {
            return res.render(`contributor/submissions`, { submissions: [], contributor, message: 'Contributor not found' });
        }

        // Find points accumulated by this contributor from different manufacturers
        const points = await Points.find({ user: contributor._id }).populate('manufacturer');  // Populating manufacturer details

        // If no points are found, display a message
        if (points.length === 0) {
            return res.render(`contributor/submissions`, { submissions: [], contributor, message: 'No points found for this email' });
        }

        // Prepare a response with manufacturers and corresponding points
        const submissions = points.map(point => ({
            manufacturerName: point.manufacturer.name,  // Assuming the manufacturer has a 'name' field
            totalPoints: point.totalPoints
        }));

        // Render the response
        res.render('contributor/submissions', { submissions, contributor, message: "" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
}


const getHistoryContributor = async (req, res) => {
    try {
        // Get contributor email from request body
        const contributorEmail = req.body.email;

        // Find the contributor by email
        const contributor = await User.findOne({ email: contributorEmail, role: 'contributor' });

        if (!contributor) {
            return res.render(`contributor/history`, { submissions: [], currentPage: 1, totalPages: 1, message: 'Contributor not found' });
        }

        // Get contributor ID
        const contributorId = contributor._id;

        // Pagination parameters
        const page = parseInt(req.query.page) || 1; // Current page number, default to 1
        const limit = 10; // Number of submissions per page
        const skip = (page - 1) * limit; // Calculate number of documents to skip

        // Find all submissions made by this contributor with pagination
        const submissions = await Submission.find({ contributor_id: contributorId })
            .populate('product_id', 'productName productPoint')
            .populate('collector_id', 'name') // Populate collector's name
            .skip(skip)
            .limit(limit);

        // Count total submissions for pagination
        const totalSubmissions = await Submission.countDocuments({ contributor_id: contributorId });
        const totalPages = Math.ceil(totalSubmissions / limit);

        // Render the history view and pass the submissions and pagination data
        res.render('contributor/history', { submissions, currentPage: page, totalPages });
    } catch (err) {
        console.error('Error fetching submission history:', err);
        res.status(500).send('Internal Server Error');
    }
};


module.exports = {
    getProducts,
    editProfile,
    searchSubmissions,
    getHistoryContributor
}