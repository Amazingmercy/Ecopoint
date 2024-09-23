const mongoose = require('mongoose');

const qrCodeSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    uniqueCode: {
        type: String,
        required: true,
        unique: true // Ensure each QR code is unique
    },
    scanned: {
        type: Boolean,
        default: false // Default to not scanned
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const QRCode = mongoose.model('QRCode', qrCodeSchema);

module.exports = QRCode;
