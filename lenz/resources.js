const axios = require('axios')
const cheerio = require('cheerio')

// given url, fetches html content of that page
const getHTML = url => new Promise((resolve, reject) => {
    axios.default.get(url).then(resp => resolve(resp.data)).catch(reject)
})

// extract out specified html element(s) from html page
const extractElementsFromHTML = (html, element) => {
    const $ = cheerio.load(html)

    $(element).each((i, v) => {
        console.log(v)
    })
}

module.exports = {
    getHTML,
    extractElementsFromHTML
}
