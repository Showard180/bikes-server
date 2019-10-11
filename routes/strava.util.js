const axios = require('axios');

const fallback = {
  name: 'Name:',
  phone: 'Phone Number:',
};

const stravaUser = {
  firstname: 'First name:',
  lastname: 'Last name:',
  bikes: 'Bikes:',
  email: 'Email:',
  profile_medium: 'Picture:',
}

const getStravaDetails = async (toReturn, stravaCode) => (
  new Promise((resolve, reject) => (
    axios.post('https://www.strava.com/oauth/token', {
      client_id: process.env.STRAVA_ID,
      client_secret: process.env.STRAVA_SECRET,
      code: stravaCode
    })
    .then(response => {
      axios.get('https://www.strava.com/api/v3/athlete',
      {
        headers: {
          Authorization: `Bearer ${response.data.access_token}`
        }
      })
      .then(res => {
        resolve(res.data);
      })
      .catch(e => reject(e.response.data.errors));
    })
    .catch(e => reject(e.response.data.errors))
  ))
)

const getStravaBikes = async (stravaCode) => (
  new Promise((resolve, reject) => (
    axios.post('https://www.strava.com/oauth/token', {
      client_id: process.env.STRAVA_ID,
      client_secret: process.env.STRAVA_SECRET,
      code: stravaCode
    })
    .then(response => {
      axios.get('https://www.strava.com/api/v3/athlete',
      {
        headers: {
          Authorization: `Bearer ${response.data.access_token}`
        }
      })
      .then(res => {
        resolve(res.data.bikes);
      })
      .catch(e => reject(e.response.data.errors));
    })
    .catch(e => reject(e.response.data.errors))
  ))
)
const userInfo = (user) => {
  return new Promise((resolve, reject) => {
    try {
      let toReturn = extractDetails(fallback, user);
      const {stravaCode} = user;
      if(stravaCode) {
        getStravaDetails(toReturn, stravaCode, fallback)
          .then(info => resolve(extractDetails(stravaUser, info, toReturn), true))
          .catch(reject);
      } else {
        resolve(toReturn)
      }
    } catch (e) {
      console.log(e);
      reject(e)
    }
  });
}

const getBikes = user => {
  return new Promise((resolve, reject) => {
    try {
      const { stravaCode } = user;
      getStravaBikes(stravaCode)
        .then(resolve)
        .catch(reject);
    } catch (error) {

    }
  })
}

function extractDetails(json, obj, user = {}) {
  return Object.keys(obj).map((item, acc) => {
    if (json.hasOwnProperty(item)) {
      const thing = {
        item,
        value: obj[item],
        title: json[item]
      }
      console.log(thing);
      return thing;
    }
  }).filter(o => o);
}

module.exports = {
  userInfo,
  getBikes
};
