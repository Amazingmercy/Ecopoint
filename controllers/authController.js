const secretKey = process.env.JWT_SECRET_KEY;
const User = require('../models/userModel')
const jwt = require('jsonwebtoken')



const viewHome = async (req, res) => {
    try {
        const manufacturers = await User.find({ role: 'manufacturer' }).select('name paymentThreshold address');
        const collectors = await User.find({ role: 'collector' }).select('name address');

        // Render the landing page with the manufacturers and collectors data
        res.render('landing', {
            manufacturers,
            collectors,
            error: "",
            message: ""
        });
    } catch (error) {
        res.status(400).json({ message: 'Error rendering Home view' })
    }
}

const viewRegister = async (req, res) => {
    try {
        res.render('index', { error: "", message: "", newUser: "" })
    } catch (error) {
        res.status(400).json({ message: 'Error rendering Login view' })
    }
}

const viewLogin = async (req, res) => {
    try {
        res.render('login', { error: "", message: "" })
    } catch (error) {
        res.status(400).json({ message: 'Error rendering Login view' })
    }
}

const register = async (req, res) => {
    const { name, email, address, password, confirmPassword, role } = req.body
    const existingUser = await User.findOne({ email })


    try {
        if (password != confirmPassword) {
            return res.status(400).render('index', { error: 'Password do not match', message: "", newUser: "" })
        }
        if (existingUser) {
            return res.status(400).render('index', { error: 'Email has been registered!', message: "", newUser: ""})
        }

        const newUser = await User.create({ name, email, password, address, role: role.toLowerCase() });
        if (role == 'Contributor') {
            res.render('index', { message: "User registered successfully, Please fill in your bank details", newUser, error: "" })
        } else if (role == 'Collector') {
            res.render('index', { message: "User registered successfully, Please fill in your bank details", newUser, error: "" })
        }
        else {
            res.render('login', { message: `User registered successfully!`, newUser, error: '' });
        }
    } catch (error) {
        res.render('index', { message: "", error: error.message });
    }

}


const login = async (req, res) => {
    try {
        const { email, password } = req.body
        if (!email || !password) {
            return res.render('login', { error: 'Enter Email and password', message: "" });
        }

        const user = await User.findOne({ email })

        if (!user) {
            return res.render('login', { error: 'Invalid Email', message: "" });
        }

        const validPassword = (password === user.password)
        if (!validPassword) {
            return res.render('login', { error: 'Invalid Password', message: "" });
        }
        const payload = {
            userId: user._id,
            userEmail: user.email,
            userRole: user.role,
        };


        const token = jwt.sign(payload, secretKey, { expiresIn: '100m' });
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
        res.redirect(`${user.role}/dashboard`, 200, { message: `Logged in successfully!`, error: "" });
    } catch (error) {
        res.render('login', { error: error.message, message: "" });
    }
}


const logout = async (req, res) => {
    const token = req.cookies.token;


    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    res.clearCookie('token'); // 'token' is the name of the cookie
    return res.redirect('/login');
}



module.exports = {
    viewHome,
    viewRegister,
    viewLogin,
    register,
    login,
    logout
}