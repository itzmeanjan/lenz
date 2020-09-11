#!/usr/bin/env node

const yargs = require('yargs')
const blessed = require('blessed')
const contrib = require('blessed-contrib')
const magnet = require('magnet-uri')
const DHT = require('bittorrent-dht')
require('colors')

const { getMyIP } = require('./ip')
const { lookup } = require('./locate')

// validates looked up ip address info, because in case of
// private ip addresses it'll return longitude & latitude fields as `0` & region & country as `-`
const validateLookup = data => !(data.lon === 0 && data.lat === 0 && data.region === '-' && data.country === '-')

yargs.scriptName('magneto'.green)
.usage('Usage: magneto <command> <params>'.bgMagenta)
.command('lookup <magnet> <db>', 'Look up peers by torrent infohash', _y => {
    _y.positional('magnet', { describe: 'torrent 🧲 link', type: 'string' })
        .positional('db', { describe: 'ip2location db5 database', type: 'string' })
}, argv => {
    console.log(argv)
}).demandCommand().help().wrap(72).argv

// if gets parsed properly & `infoHash` of torrent can
// be found, then we're good to go, otherwise, we'll exit
const parsed = magnet(options.m)
if (!parsed.infoHash) {
    console.log('[!]Bad Torrent 🧲 Link'.red)
    process.exit(1)
}

const screen = blessed.screen()
const map = contrib.map({ label: 'World Map', style: { shapeColor: 'cyan' } })

screen.append(map)

// add marker on map in specified location
const addMarkerAndRender = (lon, lat, color, char) => {
    map.addMarker({ lon, lat, color, char })
    screen.render()
}

// state of map, when true, is rendered with data
// when false, canvas is cleared
let on = true;
// enabling flashing effect
const enableFlashEffect = _ => {
    if (on) {
        markers.forEach(v => {
            map.addMarker({ lon: v.lon, lat: v.lat, color: v.color, char: v.char })
        })
    } else {
        map.clearMarkers()
    }

    screen.render()
    on = !on
}

// markers to be drawn on screen cache
const markers = []

// obtaining ip address of this machine, by sending query to
// 'https://api.ipify.org?format=json'
getMyIP().then(ip => {
    let resp = lookup(ip)
    if (validateLookup(resp)) {
        // cached host machine IP
        markers.push({ lon: resp.lon, lat: resp.lat, color: 'red', char: 'X' })

        // adding this machine's location onto map
        addMarkerAndRender(resp.lon, resp.lat, 'red', 'X')
    }

    // now init-ing dht
    const dht = new DHT()

    // starting server on 26666
    dht.listen(23456, _ => { console.log('Listening ...'.green) })
    // gets invoked when new bit torrent peer is found for a
    // specific infoHash
    dht.on('peer', (peer, infoHash, from) => {
        // looking up peer location
        let resp = lookup(peer.host)
        if (validateLookup(resp)) {
            // caching peer info
            markers.push({ lon: resp.lon, lat: resp.lat, color: 'magenta', char: 'o' })

            // adding peer location in map
            addMarkerAndRender(resp.lon, resp.lat, 'magenta', 'o')
        }
    })

    // requesting dht to lookup use provided magnet link's infoHash
    dht.lookup(parsed.infoHash)
    // flash every .5 seconds
    setInterval(enableFlashEffect, 500)
})

// pressing {esc, q, ctrl+c}, results into exit with success i.e. return value 0
screen.key(['escape', 'q', 'C-c'], (ch, key) => {
    screen.destroy()
    console.log('[+]Done'.green)
    process.exit(0)
})
screen.render()
