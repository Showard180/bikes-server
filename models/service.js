const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');
const crypto = require('crypto');

const Service = new mongoose.Schema({
  id: Number,
  userId: {type: Number, required: true},
  dropOff: {type: Date, required: true},
  pickUp: {type: Date},
  bikeIds: {type: [String], required: true},
  serviceType: {type: String, required: true},
  status: {type: String, required: true}
}, {
  collection: 'services'
});


autoIncrement.initialize(mongoose.connection);
Service.plugin(autoIncrement.plugin, {model: 'Service', field: 'id'});
module.exports = mongoose.model('Service', Service);
