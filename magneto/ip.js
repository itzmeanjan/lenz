const axios = require('axios')
const endpoint = 'https://api.ipify.org?format=json'

const getMyIP = _ => {
    return axios.get(endpoint).then(resp => resp.ip).catch(err => null)
}

module.exports = {
    getMyIP
}
