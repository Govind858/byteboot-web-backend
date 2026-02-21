const mongoose = require("mongoose")

const ProductSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true,
    },
    details: {
        type: String,
        required: true
    },
    techStack:{
        type:[String],
        required:true
    },
    category: {
        type: String,
        required: true
    }
})

const Product = mongoose.model('Product', ProductSchema)
module.exports = Product