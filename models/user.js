const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');
const crypto = require('crypto');

const User = new mongoose.Schema({
  userId: Number,
  phone: {type: String, required: true, unique: true},
  pass: String,
  salt: String,
  bikes: [{
    make: {type: String, required: true},
    model: String,
    bikeId: Number
  }],
  name: {type: String, required: true},
  refresh: String,
  lastServiceMiles: [{
    bikeId: String,
    miles: Number
  }],
  stravaCode: {type: String, default: null}
});

User.methods.createToken = function() {
  return this.refresh = this.phone.toString() + '.' + crypto.randomBytes(40).toString('hex');
}


autoIncrement.initialize(mongoose.connection);
User.plugin(autoIncrement.plugin, {model: 'Users', field: 'userId'});
User.plugin(autoIncrement.plugin, {model: 'Users', field: 'bikeId'});
module.exports = mongoose.model('Users', User);
