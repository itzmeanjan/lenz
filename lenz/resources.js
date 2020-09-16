const axios = require('axios')

const getHTML = url => new Promise((resolve, reject) => {
    axios.default.get(url).then(resp => resolve(resp.data)).catch(reject)
})

module.exports = {
    getHTML
}
