const { resolve } = require('path')
const { isIP } = require('net')
const ip2location = require('ip2location-nodejs')

// database initialization
const init = db => {
    ip2location.IP2Location_init(resolve(db))
}

// Given a valid IPv{4, 6} address, it'll lookup
// its location i.e. country, region, longitude & latitude
// and return as an object
const lookup = ip => isIP(ip) === 0 ? null : {
    ip: ip,
    lon: ip2location.IP2Location_get_longitude(ip),
    lat: ip2location.IP2Location_get_latitude(ip),
    region: ip2location.IP2Location_get_region(ip),
    country: ip2location.IP2Location_get_country_long(ip)
}

module.exports = {
    init,
    lookup
}
