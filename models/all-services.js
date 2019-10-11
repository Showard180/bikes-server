const mongoose = require('mongoose');

const AllServices = new mongoose.Schema({
    name: String,
    price: Number,
    description: String
}, {
    collection: "allservices"
});

module.exports  = mongoose.model('AllServices', AllServices);