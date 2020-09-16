const axios = require('axios')
const cheerio = require('cheerio')

// given url, fetches html content of that page
const getHTML = url => new Promise((resolve, reject) => {
    axios.default.get(url).then(resp => resolve(resp.data)).catch(reject)
})

// extract out `link` elements, which are used
// for specifying CSS resources, used in a webpage
const extractCSSResources = html => {
    const $ = cheerio.load(html)

    return $('link').map((i, v) => v.attribs.href)
}

module.exports = {
    getHTML,
    extractCSSResources
}
