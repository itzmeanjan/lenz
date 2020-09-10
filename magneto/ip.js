const axios = require('axios')
const endpoint = 'https://api.ipify.org?format=json'

const getMyIP = _ => new Promise((resolve, reject) => {
    axios.get(endpoint).then(resp => resolve(resp.data.ip)).catch(reject)
})

module.exports = {
    getMyIP
}
