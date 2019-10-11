const router = require('express').Router();
const mongoose = require('mongoose');
const Users = mongoose.model('Users');
var crypto = require('crypto');
const jwt = require('jsonwebtoken');

function createToken(user) {
  const userId = user.userId,
   secret = user.salt,
   phone = user.phone;
  return jwt.sign({
    userId,
    phone
  }, secret, {expiresIn: '3h'});
}

router.post('/login', (req, res) => {
  if(!req.body.phone || !req.body.pass) return res.status(400).send('You must pass through a phone number and password');
  Users.findOne({phone: req.body.phone}, 'userId phone pass salt', (err, user) => {
    if(!user) return res.status(401).send({message: 'Incorrect phone number or password'});
    var password = user.salt + req.body.pass;
    var hash = crypto.createHash('sha256').update(password).digest('hex');
    if(user.pass !== hash) return res.status(401).send({message: 'Incorrect phone number or pasword'});
    user.createToken();
    user.save((err, update) => {
      if(err) console.log(err);
      res.status(200).send({
        refresh: update.refresh,
        userId: update.userId
      });
    })
  });
});

router.post('/register', (req, res) => {
  var salt = crypto.randomBytes(20).toString('hex');
  var password = salt + req.body.pass;
  var hash = crypto.createHash('sha256').update(password).digest('hex');
  const user = new Users({
    name: req.body.name,
    pass: hash,
    salt: salt,
    phone: req.body.phone
  });
  user.save((err, created) => {
    if(err) {
      return res.status(400).send({message: 'Please fill in all fields'})
    }
    res.send({message: 'Created User'});
  });
});

router.get('/auth', (req, res) => {
  const refresh = req.headers.token;
  const userId = req.headers.bearer;
  Users.findOne({userId: userId}, (err, user) => {
    if(err) console.log(err);
    if(!user) return res.status(401).send({message: 'No user with that id'})
    if(user.refresh!==refresh) return res.status(403).send({message: 'Unauthorized'});
    const access = createToken(user);
    res.status(200).json(access);
  })
})

router.get('/verify', (req, res) => {
  Users.findOne({userId: req.headers.bearer}, (err, user) => {
    if(!user) {
      return res.status(401).send({message: 'User not found'});
    }

    if(err) {
      res.status(500).send({message: 'Something went wrong please try again'});
      return console.log(err);
    }
    jwt.verify(req.headers.auth, user.salt, (err, payload) => {
      if(err) {
        console.log('Access token is invalid');
        res.status(401).send({message: 'Access token expired'});
      } else {
        res.send({message: 'Valid token'})
      }
    })
  })
})

router.get('/logout', (req, res) => {
  Users.findOneAndUpdate({userId: req.query.userId}, {refresh: null}, (err, user) => {
    if(err) {
      console.log('THERE WAS AN ERROR', err);
      return res.status(500).send(err)
    };
    res.send({message: 'DONE'});
  })
})

module.exports = router;
