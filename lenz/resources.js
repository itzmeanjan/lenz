const axios = require('axios')
const cheerio = require('cheerio')
const {URL} = require('url')

// given url, fetches html content of that page
const getHTML = url => new Promise((resolve, reject) => {
    axios.default.get(url).then(resp => resolve(resp.data)).catch(reject)
})

// extract out `link` elements, which are used
// for specifying CSS resources, in a webpage
const extractCSSResources = html => {
    const buffer = []

    const $ = cheerio.load(html)
    $('link').each((i, v) => {
        buffer.push(v.attribs.href)
    })

    return buffer
}

// extract out `script` elements, which are used
// for specifying JS resources, in a webpage
const extractScriptResources = html => {
    const buffer = []

    const $ = cheerio.load(html)
    $('script').each((i, v) => {
        if (v.attribs.src !== undefined) {
            buffer.push(v.attribs.src)
        } else if (v.attribs['data-src'] !== undefined) {
            buffer.push(v.attribs['data-src'])
        }
    })

    return buffer
}

// given an url, checks whether this can be considered
// as a valid url in terms of format. No liveness is checked
const validateURL = url => {
    try{
        new URL(url)
        return true
    } catch {
        return false
    }
}

module.exports = {
    getHTML,
    extractCSSResources,
    extractScriptResources,
    validateURL
}
