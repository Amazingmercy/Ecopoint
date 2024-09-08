const Product = require('../models/productModel')
const User = require('../models/userModel')
const Points = require('../models/pointsModel');
const mongoose = require('mongoose');


const viewDashboard = async (req, res) => {
    try {

        const manufacturerId = req.user.userId;
        const manufacturerObjectId = new mongoose.Types.ObjectId(manufacturerId);

        // Fetch total products created by this manufacturer
        const totalProducts = await Product.countDocuments({ manufacturer: manufacturerId });

        // Fetch total contributors who have points from this manufacturer (role = 'contributor')
        const contributors = await Points.find({ manufacturer: manufacturerId })
            .populate({
                path: 'user',
                match: { role: 'contributor' },  // Filter to match contributors
                select: 'role'  // Select the role field
            });

        const totalContributors = contributors.filter(contributor => contributor.user).length;

        // Fetch total collectors who have collected products from this manufacturer (role = 'collector')
        const collectors = await Points.find({ manufacturer: manufacturerId })
            .populate({
                path: 'user',
                match: { role: 'collector' },  // Filter to match collectors
                select: 'role'  // Select the role field
            });

        const totalCollectors = collectors.filter(collector => collector.user).length;
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

        // Render the dashboard with the retrieved data
        res.render('manufacturer/dashboard', {
            totalProducts,
            totalCollectors,
            totalContributors,
            pointsDistributed,
            error: "",
            message: ""
        });
    } catch (error) {
        console.error(error);
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
    const productName = product.productName
    const points = product.points



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




module.exports = {
    viewDashboard,
    viewAddProduct,
    addProduct,
    viewProducts,
    deleteProduct,
    updateProduct,
    viewOneProduct
}