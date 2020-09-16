const axios = require('axios')
const cheerio = require('cheerio')
const { url } = require('inspector')
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

// given a list of url(s) i.e. either css/ script resources
// returns a set of domain names i.e. only unique domain names to be returned
const extractDomainNamesFromURLs = data => {
    let set = new Set()

    data.filter(validateURL).forEach(v => {
        set.add(new URL(v).hostname)
    })

    return set
}

// given two sets, each having only unique domain names
// merges them into a single one
const mergetTwoSets = (s1, s2) => {
    let tmp = new Set(s1.values())

    for(let i of s2.values()) {
        tmp.add(i)
    }

    return tmp
}

module.exports = {
    getHTML,
    extractCSSResources,
    extractScriptResources,
    validateURL,
    extractDomainNamesFromURLs
}
