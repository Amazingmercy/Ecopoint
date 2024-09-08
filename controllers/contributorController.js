const Product = require('../models/productModel')
const User = require('../models/userModel')
const Submission = require('../models/submissionModel')
const Points = require('../models/pointsModel')




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

        const user = await User.findOneAndUpdate(
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

        const manufacturers = await User.find({ role: 'manufacturer' }).select('name email');
        const collectors = await User.find({ role: 'collector' }).select('name email');

        if (user.role == 'contributor') {
            // Render the landing page with the manufacturers and collectors data
            res.render('landing', {
                manufacturers,
                collectors,
                error: "",
                message: "Bank details updated successfully!"
            });
        } else {
            res.render('collector/dashboard', { message: 'Bank details updated successfully!' });
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




module.exports = {
    getProducts,
    editProfile,
    searchSubmissions
}