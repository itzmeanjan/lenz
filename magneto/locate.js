const dotnet = require('dotenv')
dotnet.config({ path: 'config.env' })

const ip2location = require('ip2location-nodejs')
ip2location.IP2Location_init(process.env.DB)

const { isIP } = require('net')

const lookup = ip => isIP(ip) === 0 ? null : {
    ip: ip,
    lon: ip2location.IP2Location_get_longitude(ip),
    lat: ip2location.IP2Location_get_latitude(ip),
    region: ip2location.IP2Location_get_region(ip),
    country: ip2location.IP2Location_get_country_long(ip)
}

module.exports = {
    lookup
}
