const express = require('express')
const http = require('http')
const isIP = require('net').isIP
const ip2location = require('ip2location-nodejs')

// initializing ip2location lookup system using binary file
ip2location.IP2Location_init('../IP2LOCATION-LITE-DB5.IPV6.BIN')

const app = express()

// logging time of request & path requested
const logger = (req, _, next) => {
    console.log(`${req.path} | ${new Date().getTime()/1000}`)
    next()
}

app.use(logger)

// this is our only path on which we'll listen for get requests & if valid ip address
// is sent, we'll lookup it's location information, which will be sent back as JSON response
app.get('/ip/:addr', (req, res) => {
    if (isIP(req.params.addr) === 0) {
        return res.status(400).contentType('application/json').send(JSON.stringify({
            msg: 'Bad Input'
        }, null, '\t'))
    }

    return res.status(200).contentType('application/json').send(JSON.stringify({
        ip: req.params.addr,
        lon: ip2location.IP2Location_get_longitude(req.params.addr),
        lat: ip2location.IP2Location_get_latitude(req.params.addr),
        region: ip2location.IP2Location_get_region(req.params.addr),
        country: ip2location.IP2Location_get_country_long(req.params.addr)
    }, null, '\t'))
})

// starting simple http server
http.createServer(app).listen(8000, '0.0.0.0',
    _ => { console.log('Listening on http://0.0.0.0:8000\n') })
