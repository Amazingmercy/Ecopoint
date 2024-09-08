const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define the Submissions schema
const submissionSchema = new Schema({
    product_id: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    productName: {
        type: String, 
        required: true
    },
    productPoint: {
        type: Number,
        required: true
    },
    contributor_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    submission_date: {
        type: Date,
        default: Date.now
    }
});

// Create the model from the schema
const Submission = mongoose.model('Submission', submissionSchema);

module.exports = Submission;
