const mongoose = require('mongoose');
const Users = mongoose.model('Users');
const Strava = require('./routes/strava.util');
const CronJob = require('cron').CronJob;

const notify = (user, bike) => {
  axios({
    method: 'POST',
    url: 'https://rest.textmagic.com/api/v2/messages',
    headers: {
      'X-TM-Username': 'david@bigonbikes.co.uk',
      'X-TM-Key': 'fbsBfmWRUdK2XfH1C5pCSfUnYlwydC'
    },
    data: {
      text: `Hi ${user.name}, you've gone at least 2000 miles on ${bike.name} since you last had a service. Time to book another one?`,
      phones: '447469703402',
      from: '447866265804',
    }
  }).then(() => console.log('text sent')).then(resolve).catch((e) => {console.log(e.response.data); reject()});
}

const setupCronJob = () => {
  new CronJob('* * * * * *', function() {
    Users.find({ stravaCode: { $ne: null } }, (err, users) => {
      users.forEach(user => {
        Strava.getBikes(user)
          .then(bikes => {
            if (user.lastServiceMiles.length) {
              bikes.forEach(bike => {
                const id = bike.id;
                const lastService = user.lastServiceMiles.find(service => service.id === id);
                if (bike.miles > lastService.miles + 2000) {
                  notify(user, bike);
                  const index = user.lastServiceMiles.findIndex(o => o.id === id);
                  user.lastServiceMiles[index].miles = bike.miles
                  Users.findOneAndUpdate({ userId: user.userId }, { lastServiceMiles: user.lastServiceMiles })
                }
              })
            }
          });
      });
    });
  }, null, true, 'Europe/London');
}

module.exports = setupCronJob;
