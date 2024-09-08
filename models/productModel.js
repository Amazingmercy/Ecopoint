const mongoose = require('mongoose');
const { Schema } = mongoose;



const productSchema = new Schema({
  productName: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  productImage: {
    type: String,
  },
  points: {
    type: Number,
    required: true
  },
  manufacturer: {
    type: Schema.Types.ObjectId,
    ref: 'User',  // Reference to the User model
    required: true,
  },
});

// Create the Product model
const Product = mongoose.model('Product', productSchema);

module.exports = Product;