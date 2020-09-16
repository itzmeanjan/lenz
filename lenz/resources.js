const axios = require('axios')
const cheerio = require('cheerio')

// given url, fetches html content of that page
const getHTML = url => new Promise((resolve, reject) => {
    axios.default.get(url).then(resp => resolve(resp.data)).catch(reject)
})

// extract out `link` elements, which are used
// for specifying CSS resources, used in a webpage
const extractCSSResources = html => {
    const buffer = []

    const $ = cheerio.load(html)
    $('link').each((i, v) => {
        buffer.push(v.attribs.href)
    })

    return buffer
}

module.exports = {
    getHTML,
    extractCSSResources
}
