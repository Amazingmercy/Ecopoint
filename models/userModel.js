const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define the User schema
const userSchema = new Schema({
    name: {
        type: String,
        maxlength: 50,
        trim: true,
    },
    email: {
        type: String,
        maxlength: 50,
        trim: true,
    },
    address: {
        type: String,
        maxlength: 50,
        trim: true,
    },
    paymentThreshold: {
        type: Number,
        default:0
    },
    password: {
        type: String,
        maxlength: 255,
        trim: true,
    },
    role: {
        type: String,
        enum: ['manufacturer', 'collector', 'contributor'],
        required: true,
    },
    joinDate: {
        type: Date,
        default: Date.now,
    },
    bankDetails: {
        bankName: {
            type: String,
            maxlength: 100,
            trim: true,
        },
        accountNumber: {
            type: String,
            maxlength: 20,
            trim: true,
        },
        accountName: {
            type: String,
            maxlength: 100,
            trim: true,
        }
    }
});

// Create the User model
const User = mongoose.model('User', userSchema);

module.exports = User;
