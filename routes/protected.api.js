const router = require('express').Router();
const mongoose = require('mongoose');
const util = require('util');
const Users = mongoose.model('Users');
const Service = mongoose.model('Service');
const Strava = require('./strava.util.js');
const newService = require('./service.util.js');

const json = {
  name: 'Name:',
  phone: 'Phone Number:',
  bikes: 'Bikes:',
}

router
  .get('/user-info', (req, res) => {
    const {
    bearer
  } = req.headers;

    Users.findOne({ userId: bearer }, 'name phone bikes stravaCode', {lean: true}, (err, u) => {
      if (err) {
        console.log(err);
        return res.status(500).send({ err });
      }
      Strava.userInfo(u)
        .then((user) => {
          const userDetails = user.filter(userItem => userItem.item !== 'profile_medium');
          const picture = user.find(userItem => userItem.item === 'profile_medium')
          let stravaEnabled = false;
          if (u.stravaCode) { stravaEnabled = true }
          res.send({ user: userDetails, picture, stravaEnabled});
        })
        .catch(err => {
          console.log(err);
          res.status(500).send('There was an error')
        })
    });
  })
  .get('/edit-details', (req, res) => {
    const {
    bearer,
      edit,
      value
  } = req.headers;

    Users.findOneAndUpdate({ userId: bearer }, { [edit]: value }, (err, user) => {
      console.log(err ? err : user);
      if (!err) {
        const arr = [];
        for (var detail in user) {
          if (json.hasOwnProperty(detail)) {
            arr.push({
              item: detail,
              value: user[detail],
              title: json[detail]
            })
          }
        }
        res.send({ user: arr })
      } else {
        res.status(500).send({ message: 'Something went wrong try again later' })
      }
    })
  })
  .put('/create/bike', ({ body, headers }, res) => {
    const {
    bearer
  } = headers;

    Users.findOne({ userId: bearer }, (e, user) => {
      if (e) {
        console.log(e);
        return res.status(500).send({ message: 'Something went wrong, please try again later' });
      }
      user.bikes.push(body);
      user.save((e,u) => {
        if (e) {
          console.log(e);
          return res.status(500).send({ message: 'Something went wrong, please try again later' });
        }
        return res.status(200).send({ message: 'Bike created successfully' });

      })
    });
  })
  .get('/bikes', ({ headers }, res) => {
    const {
    bearer
  } = headers;

    Users.findOne({ userId: bearer }, (e, user) => {
      if (e) {
        console.log(e);
        return res.status(500).send({ message: 'Something went wrong, please try again later.' });
      }

      if (user.stravaCode) {
        return Strava.getBikes(user)
          .then(bikes => res.status(200).send({ message: 'Bikes returned successfully', bikes }))
      }

      const {
        bikes
      } = user;

      return res.status(200).send({ message: 'Bikes returned successfully', bikes });
    });
  })
  .post('/bike', ({ body, headers }, res) => {
    const {
    bearer
  } = headers;
    const {
    bikeId
  } = body;

    Users.findOne({ userId: bearer }, (e, user) => {
      if (e) {
        console.log(e);
        return res.status(500).send({ message: 'Something went wrong, please try again later.' });
      }

      let { bikes } = user;
      bikes = bikes.map(bike => (bike._id == bikeId) ? undefined : bike).filter(o => o);
      user.bikes = bikes;
      user.save(e => {
        if (e) {
          console.log(e);
          return res.status(500).send({ message: 'Something went wrong, please try again later.' });
        }

        return res.status(200).send({ message: 'Bike successfully deleted' });
      })
    })
  })
  .post('/edit-bike', ({ body, headers }, res) => {
    const {
    bearer
  } = headers;
    const {
    bikeId,
      edit,
      value
  } = body;

    Users.findOne({ userId: bearer }, (e, user) => {
      if (e) {
        console.log(e);
        return res.status(500).send({ message: 'Something went wrong, please try again later.' });
      }

      bikes = user.bikes.map(bike => {
        if (bike._id == bikeId) {
          bike[edit] = value
        }
        return bike;
      });

      Users.findOneAndUpdate({ userId: bearer }, { bikes }, e => {
        if (e) {
          console.log(e);
          return res.status(500).send({ message: 'Something went wrong, please try again later.' });
        }

        return res.status(200).send({ message: `Successfully edited ${edit}` });
      })
    })
  })
  .post('/create/service', (req, res) => {
    const {
        bearer
    } = req.headers;

    Users.findOne({ userId: bearer }, (err, user) => {
      console.log(err ? err : user)
      newService(req.body, user);
    });

    // new Service(body)
    //   .save((e, service) => {
    //     if (e) {
    //       console.log(e);
    //       return res.status(500).send({ message: 'Something went wrong, please try again later.' });
    //     }

    //     Users.findOne({ userId: service.userId }, (err, user) => {
    //       newService(body, user).then(() => res.send({ message: 'Service created', service }));
    //     })
    //   });
  })
  .get('/services', ({ headers }, res) => {
    const {
      bearer
    } = headers;

    Service.find({ userId: bearer }, (e, services) => {
      if (e) {
        console.log(e);
        return res.status(500).send({ message: 'Something went wrong, please try again later.' });
      }

      return res.send({ message: 'Returned services', services });
    });
  })
  .get('/service/:id', ({ headers }, res) => {
    const {
    bearer,
      id
  } = headers;

    Service.findOne({ userId: bearer, id }, (e, service) => {
      if (e) {
        console.log(e);
        return res.status(500).send({ message: 'Something went wrong, please try again later' });
      }

      if (!service) {
        return res.send(400).send({ message: `No service found with id: ${id}` });
      }

      return res.send({ message: 'Successfully found service', service });
    })
  });
module.exports = router;
