const axios = require('axios');
const nodemailer = require('nodemailer');
const moment = require('moment');

const newService = (service, user) => (
  new Promise((resolve, reject) => {
    console.log('creating new service')
    const date = new Date(service.startDate);
    date.setHours(8);
    date.setMinutes(0);
    console.log(date.getTime())
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER, // Your email id
        pass: process.env.EMAIL_PASS, // Your email password
      }
    });

    let bikes;
    let bikeDetail;

    if (service.bikeIds) {
      bikes = service.bikeIds.map(id => {
        return user.bikes.find(bike => bike._id == id);
      });
    } else if (service.bike['bike-make']) {
      const b = service.bike;
      bikeDetail = `${b['bike-model']} ${b['bike-model']}`
    } else if (service.bike.name) {
      bikeDetail = service.bike.name
    };

    const startDate = moment(new Date(service.startDate)).format('Do MMM');
    const endDate = moment(new Date(service.endDate)).format('Do MMM');

    const bikeString = `${bikes && bikes.length ? bikes.map(bike => `${bike.make} ${bike.model}`) : bikeDetail}`;

    var mailOptions = {
      from: 'Big on bikes app',
      to: 'sam180howard@gmail.com',
      subject: `${user.name}'s service.`,
      text: `Hi,
      ${user.name} has requested a service for their bike${bikes && bikes.length > 1 ? 's' : ''}: ${bikeString}.
      They would like to drop the bike off at ${startDate} and pick it up at ${endDate}. \n Their phone number is: ${user.phone}`
    };
    transporter.sendMail(mailOptions, function(error, info, data) {
      if (error) {
        console.log(error)
        reject('Something went wrong please try again later')
      } else {
        console.log('Email Sent!');
      }
    });
    axios({
      method: 'POST',
      url: 'https://rest.textmagic.com/api/v2/messages',
      headers: {
        'X-TM-Username': 'david@bigonbikes.co.uk',
        'X-TM-Key': 'fbsBfmWRUdK2XfH1C5pCSfUnYlwydC'
      },
      data: {
        text: `Reminder, you are scheduled to drop off your ${bikeDetail} for a service today at ${startDate.split(',')[0]}`,
        phones: user.phone.replace(/0/, '44'),
        sendingTime: date.getTime(),
        from: '447866265804',
      }
    }).then(() => console.log('text sent')).then(resolve).catch((e) => {console.log(e.response.data.errors); reject()});
  })

)

module.exports = newService;
