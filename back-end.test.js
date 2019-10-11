const chai = require('chai');
const expect = chai.expect;
const mongoose = require('mongoose');
const app = require('./server.js').app;
const User = mongoose.model('Users')
const axios = require('axios');
const request = require('request');
const baseUrl = process.env.SERVER_URL || 'http://localhost:8080';

let refresh;
let userId;
let access;
let user;
let bikeId;

describe('Tests for the server', () => {
  after(done => {
    User.remove({phone: '071342'}, (err, something) => {
      expect(err).to.eql(null);
      done();
    });
  });
  describe('Auth functions', () => {
    it('Registers a user', done => {
      user = {
        phone: '071342',
        pass: 'something',
        name: 'Sam Sam',
      }
      axios.post(`${baseUrl}/user/register`, user).then(res => {
        expect(res.status).to.eql(200);
        done();
      }).catch(err => {
        expect(err).to.eq(null);
        done();
      })
    })

    it('logs that user in', done => {
      const user = {
        phone: '071342',
        pass: 'something'
      }
      axios.post(`${baseUrl}/user/login`, user).then(res => {
        expect(res.status).to.eql(200);
        refresh = res.data.refresh
        userId = res.data.userId
        done();
      }).catch(err => {
        expect(err).to.eq(null);
        done();
      })
    })

    it('provides an access token', done => {
      axios.get(`${baseUrl}/user/auth`, {headers: {'token': refresh, 'bearer': userId}}).then(res => {
        expect(res.status).to.eql(200)
        access = res.data;
        done();
      }).catch(err => {
        expect(err).to.eq(null);
        done();
      })
    })
  });

  describe('Bike CRUD', () => {
    it('creates a new bike', done => {
      axios.put(`${baseUrl}/api/create/bike`, {make: 'BestBike', model: 'BMX'}, {headers: {'auth': access, 'bearer': userId}}).then(res => {
        expect(res.status).to.eql(200);
        expect(res.data.message).to.eql('Bike created successfully');
        done();
      }).catch(err => {
        expect(err).to.eq(null);
        done();
      });
    });

    it('gets all bikes created', done => {
      axios
      .get(`${baseUrl}/api/bikes`, {headers: {auth: access, bearer: userId}})
      .then(res => {
        expect(res.status).to.eql(200);
        expect(res.data.message).to.eql('Bikes returned successfully');
        expect(res.data.bikes).to.be.a('Array');
        expect(res.data.bikes[0]).to.be.a('Object');
        expect(res.data.bikes[1]).to.eql(undefined);
        const bike = res.data.bikes[0];
        expect(bike).to.have.property('make', 'BestBike');
        expect(bike).to.have.property('model', 'BMX');
        expect(bike).to.have.property('_id');
        bikeId = bike._id;
        done();
      })
      .catch(err => {
        expect(err).to.eq(null);
        done();
      });
    });

    it('updates a bike', done => {
      axios
      .post(`${baseUrl}/api/edit-bike`, {bikeId, value: 'Road bike', edit: 'model'}, {headers: {auth: access, bearer: userId}})
      .then(res => {
        expect(res.status).to.eql(200);
        expect(res.data.message).to.eql('Successfully edited model');
        done();
      })
      .catch(err => {
        expect(err).to.eql(null);
        done();
      })
    });
  });

  describe('Strava', () => {
    it('puts the access token for strava in the database', done => {
      axios
      .get(`${baseUrl}/strava/${userId}?code=stravaCode`)
      .then(res => {
        expect(res.data).to.eql('Finished, you can return to the app now...');
        User.findOne({userId}, (err, user) => {
          expect(user.stravaCode).to.eql('stravaCode');
          done();
        })
      })
      .catch(err => {
        expect(err).to.eql(null);
        done();
      })
    });
  });

  describe('Service CRUD', () => {
      it('creates a new service', done => {
        axios
          .post(`${baseUrl}/api/create/service`, {
            dropOff: new Date(),
            pickUp: new Date() + 1,
            bikeIds: [bikeId],
            serviceType: 'full-service',
            status: 'PENDING'
          }, {headers: {auth: access, bearer: userId}})
          .then(res => {
            expect(res.data.message).to.eql('Service created');
            const { service } = res.data;
            expect(service).to.have.property('userId', userId);
            expect(service).to.have.property('serviceType', 'full-service');
            expect(service).to.have.property('status', 'PENDING');
            done();
          })
          .catch(err => {
            console.log(err)
            expect(err).to.eql(null);
            done();
          })
      }).timeout(10000);
  });
});
