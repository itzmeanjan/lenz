const express = require('express')
const http = require('http')
const isIP = require('net').isIP
const ip2location = require('ip2location-nodejs')

ip2location.IP2Location_init('../IP2LOCATION-LITE-DB5.IPV6.BIN')

const app = express()

app.get('/ip/:addr', (req, res) => {
    if (isIP(req.params.addr) === 0) {
        return res.status(400).contentType('application/json').send(JSON.stringify({
            msg: 'Bad Input'
        }, space = '\t'))
    }

    return res.status(200).contentType('application/json').send(JSON.stringify({
        ip: req.params.addr,
        lon: ip2location.IP2Location_get_longitude(req.params.addr),
        lat: ip2location.IP2Location_get_latitude(req.params.addr),
        region: ip2location.IP2Location_get_region(req.params.addr),
        country: ip2location.IP2Location_get_country_long(req.params.addr)
    }, space = '\t'))
})

http.createServer(app).listen(8000, '0.0.0.0',
    _ => { console.log('Listening on http://0.0.0.0:8000\n') })
