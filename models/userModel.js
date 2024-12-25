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
    walletDetails: {
        walletAddress: {
            type: String,
            maxlength: 100,
            trim: true,
            default: 'address'
        }
    }
});

// Create the User model
const User = mongoose.model('User', userSchema);

module.exports = User;
