const express = require('express');
const app = express();
const mongoose = require('mongoose');
require('./models/user.js');
require('./models/service.js');
const User = require('./routes/user.api.js');
const Api = require('./routes/protected.api.js');
const cron = require('./cron');
const Admin = require('./routes/admin.api.js');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const Users = mongoose.model('Users');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/Bikes');
mongoose.Promise = require('bluebird');
const connection = mongoose.connection;
// cron();
connection.once('open', () => {
  console.log('Database connected');
});
const port = process.env.PORT || 8080;

// setup port listening and error handling
app.listen(port, () => {
  console.log('Server listening on port: ', port);
})

app
  // use body parser
  .use(bodyParser.urlencoded({
    extended: true
  }))
  .use(bodyParser.json())
  // setup routing
  .use('/user', User)
  .use('/strava', (req, res) => {
    Users.findOneAndUpdate({userId:req.url.split('/')[1].split('?')[0]}, {stravaCode: req.query.code}, (err, user) => {
      if(err) return res.status(500).send('There was an error please try again later' + err);
      res.send('Finished, you can return to the app now...')
    });
  })
  // oauth middleware, checks for valid access token
  .use((req, res, next) => {
    Users.findOne({userId: req.headers.bearer}, (err, user) => {
      if(err) console.log(err);
      if(!user) return res.status(401).json('Invaid access token');
      jwt.verify(req.headers.auth, user.salt, (err) => {
        if(err) {
          console.log(err);
          return res.status(401).json('Invalid access token')
        }
        next();
      })
    })
  })
  // if token is valid use protected routes
  .use('/api', Api);

module.exports = {
  app
};
