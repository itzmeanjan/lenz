#!/usr/bin/env node

const blessed = require('blessed')
const contrib = require('blessed-contrib')
const magnet = require('magnet-uri')
const { existsSync } = require('fs')
const { isIP } = require('net')
const dns = require('dns')
const isValidDomain = require('is-valid-domain')
const DHT = require('bittorrent-dht')
require('colors')

const { getMyIP } = require('./ip')
const { init, lookup } = require('./locate')

// validating user given torrent magnet link
const checkMagnetLinkValidation = _magnet => {
    const parsed = magnet(_magnet)
    if (!parsed.infoHash) {
        console.log('[!]Bad Torrent 🧲 Link'.red)
        process.exit(1)
    }

    return parsed.infoHash
}

// checking existance of local ip2location db5 file
// if not present, exit process with return code 1
const checkDB5Existance = db => {
    if (!existsSync(db)) {
        console.log('[!]Can\'t find IP2Location DB5'.red)
        process.exit(1)
    }
}

// checking whether supplied domain name is valid or not
// if not, exit process with return code 1
const checkDomainNameValidation = domain => {
    if (!isValidDomain(domain)) {
        console.log('[!]Invalid domain name'.red)
        process.exit(1)
    }
}

// validates looked up ip address info, because in case of
// private ip addresses it'll return longitude & latitude fields as `0` & region & country as `-`
const validateLookup = data => !(data.lon === 0 && data.lat === 0 && data.region === '-' && data.country === '-')

// validates user provided IPv{4,6} address
const checkIPAddressValidation = ip => {
    if (!isIP(ip)) {
        console.log('[!]Invalid IP Address'.red)
        process.exit(1)
    }
}

// add marker on map in specified location
const addMarkerAndRender = (lon, lat, color, char, map, screen) => {
    map.addMarker({ lon, lat, color, char })
    screen.render()
}

// cache for markers to be drawn on screen
const markers = []
// state of map, when true, is rendered with data
// when false, canvas is cleared
let on = true;
// enabling flashing effect
const enableFlashEffect = (map, screen) => {
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

// initial rendering to be done here, on provided
// screen handler & exit mechanism to be set up
const setUpScreenAndRender = fn => {
    const screen = blessed.screen()
    const map = contrib.map({ label: 'World Map', style: { shapeColor: 'cyan' } })
    
    screen.append(map)
    worker(map, screen, fn)

    // pressing {esc, q, ctrl+c}, results into exit with success i.e. return value 0
    screen.key(['escape', 'q', 'C-c'], (ch, key) => {
        screen.destroy()
        console.log('[+]Done'.green)
        process.exit(0)
    })
    // first screen render
    screen.render()
}

// Actual location drawing manager
//
// first finds this machine's IP & draws it
// then invokes middleware supplied
// and enables location marker flashing mechanism
const worker = (map, screen, fn) => {
    getMyIP().then(ip => {
        let resp = lookup(ip)
        if (validateLookup(resp)) {
            // cached host machine IP
            markers.push({ lon: resp.lon, lat: resp.lat, color: 'red', char: 'X' })
            // adding this machine's location onto map
            addMarkerAndRender(resp.lon, resp.lat, 'red', 'X', map, screen)
        }

        // middleware to be invoked
        fn()

        // flash every .5 seconds
        setInterval(enableFlashEffect, 500, map, screen)
    })
}

require('yargs').scriptName('lenz'.magenta)
    .usage(`${'[+]Author  :'.bgGreen} Anjan Roy < anjanroy@yandex.com >\n${'[+]Project :'.bgGreen} https://github.com/itzmeanjan/lenz`)
    .command('lm <magnet> <db>', 'Find peers by Torrent Infohash', {
        magnet: { describe: 'torrent 🧲 link', type: 'string' },
        db: { describe: 'path to ip2location-db5.bin', type: 'string' }
    }, argv => {
        checkDB5Existance(argv.db)
        const infoHash = checkMagnetLinkValidation(argv.magnet)

        // initialized ip2location db5 database
        init(argv.db)
        setUpScreenAndRender(_ => {
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
                    addMarkerAndRender(resp.lon, resp.lat, 'magenta', 'o', map, screen)
                }
            })

            // requesting dht to lookup use provided magnet link's infoHash
            dht.lookup(infoHash)
        })
    })
    .command('ld <domain> <db>', 'Find location of Domain Name',
        {
            domain: { describe: 'domain name to be looked up', type: 'string' },
            db: { describe: 'path to ip2location-db5.bin', type: 'string' }
        }, argv => {
            checkDB5Existance(argv.db)
            checkDomainNameValidation(argv.domain)

            init(argv.db)
            setUpScreenAndRender(_ => {
                dns.lookup(argv.domain, { all: true, verbatim: true }, (err, addrs) => {
                    if (err !== undefined && err !== null) {
                        screen.destroy()
                        console.log('[!]Domain name look up failed'.red)
                        process.exit(0)
                    }

                    addrs.forEach(v => {
                        let resp = lookup(v.address)
                        if (validateLookup(resp)) {
                            // cached dns looked up address's location info
                            markers.push({ lon: resp.lon, lat: resp.lat, color: 'magenta', char: 'o' })
                            // adding dns looked up address's location onto map
                            addMarkerAndRender(resp.lon, resp.lat, 'magenta', 'o', map, screen)
                        }
                    })

                    console.log('Successful look up'.green)
                })
            })
        })
    .command('lp <ip> <db>', 'Find location of IP Address',
        {
            ip: { describe: 'IP Address to be located', type: 'string' },
            db: { describe: 'path to ip2location-db5.bin', type: 'string' }
        }, argv => {
            checkDB5Existance(argv.db)
            checkIPAddressValidation(argv.ip)

            init(argv.db)
            setUpScreenAndRender(_ => {
                let resp = lookup(argv.ip)
                if (validateLookup(resp)) {
                    // cached target machine IP
                    markers.push({ lon: resp.lon, lat: resp.lat, color: 'magenta', char: 'o' })
                    // adding target machine's location into map
                    addMarkerAndRender(resp.lon, resp.lat, 'magenta', 'o', map, screen)
                }

                console.log('Successful look up'.green)
            })
        })
    .demandCommand().help().wrap(72).argv
