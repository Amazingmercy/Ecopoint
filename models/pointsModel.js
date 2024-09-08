const mongoose = require('mongoose');
const { Schema } = mongoose;

const pointsSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',  // Reference to the contributor (user) who is accumulating points
        required: true
    },
    manufacturer: {
        type: Schema.Types.ObjectId,
        ref: 'User',  // Reference to the manufacturer (user)
        required: true
    },
    totalPoints: {
        type: Number,
        default: 0  // Total points accumulated from this manufacturer
    }
});

const Points = mongoose.model('Points', pointsSchema);
module.exports = Points;
