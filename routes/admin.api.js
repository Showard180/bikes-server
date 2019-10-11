const router = require('express').Router();
const mongoose = require('mongoose');
const Users = mongoose.model('Users');
const Services = mongoose.model('Service');
const axios = require('axios');

function refactorServices(services) {
  let toReturn = [];
  return new Promise((resolve) => {
    if(services.length<1) return resolve(null, []);
    for(let i=0; i<services.length; i++) {
      let o = services[i];
      o.dropOff = new Date(o.dropOff);
      o.pickUp = new Date(o.pickUp);
      Users.findOne({userId: o.userId}, (err, user) => {
        if(err) res.status(500).json(err);
        const obj = {
          pickUp: o.pickUp,
          dropOff: o.dropOff,
          name: user.first + ' ' + user.last,
          bikes: o.bikes,
          id: o.id
        };
        if(i===services.length-1) return resolve({obj, toReturn});
        toReturn.push(obj)
      });
    }
  });
}


router.get('/getClients', (req, res) => {
  Users.find({type: 'User'}, 'first last phone', (err, users) => {
    if(err) res.status(500).json(err);
    res.send(users);
  });
});

router.get('/getBookings', (req, res) => {
  Services.find({}, (err, services) => {
    if(!services[0]) return res.json('There are no services');
    refactorServices(services)
      .then(result => {
        let serv = result.toReturn;
        let obj = result.obj;
        serv.push(obj);
        res.json(serv);
      })
      .catch(err => {
        console.log(err);
      });
  });
});

router.get('/getNotifications', (req, res) => {
  Services.find({status: 'pending'}, (err, services) => {
    if(!services[0]) return res.json([]);
    refactorServices(services)
      .then(result => {
        let serv = result.toReturn;
        let obj = result.obj;
        serv.push(obj);
        res.json(serv);
      })
      .catch(err => {
        console.log(err);
      });
  });
});

router.post('/service', (req, res) => {
  const id = req.body.id;
  Services.findOne({id}, (err, service) => {
    if(err) return res.status(500).json("We're sorry, there was an error. Please try again later");
    res.json({service});
  });
});

router.post('/accept-service', (req, res) => {
  Services.findOneAndUpdate({id: req.body.id}, {status: "approved"}, err => {
    if(err) return res.status(500).send('There was an error, please try again later');
    Services.find({status: "pending"}, (err, services) => {
      refactorServices(services)
        .then(result => {
          let serv = result.toReturn;
          let {obj} = result;
          if(obj) {
            serv.push(obj);
          }
          res.json(serv);
        });
    });
  });
});

router.get('/strava-details', (req, res) => {
  const userId = req.headers.bearer;
  Users.findOne({userId}, 'stravaCode', (err, user) => {
    if(err) return res.status(500).send(err);
    const stravaCode = user.stravaCode;
    // do the get to strava here
  });
});

module.exports = router;
