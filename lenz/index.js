#!/usr/bin/env node

const blessed = require('blessed')
const contrib = require('blessed-contrib')
const magnet = require('magnet-uri')
const { existsSync, writeFile } = require('fs')
const { isIP } = require('net')
const dns = require('dns')
const isValidDomain = require('is-valid-domain')
const DHT = require('bittorrent-dht')
require('colors')
const { platform } = require('os')
const { getTCPAndUDPPeers } = require('./socket')

const { getMyIP } = require('./ip')
const { init, lookup } = require('./locate')
const { getHTML, extractCSSResources, extractScriptResources, extractDomainNamesFromURLs, mergetTwoSets } = require('./resources')

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
let markers = []
// state of map, when true, is rendered with data
// when false, canvas is cleared
let on = true;
// enabling flashing effect
const enableFlashEffect = (map, screen) => {
    if (on) {
        // only extracting out unique ip addresses
        // it was causing an issue, when looking up
        // active socket connections using `lsof`
        // where multiple same remote addresses can be
        // which is why this part is necessary
        // it's not very expensive function, to run every 1 sec
        //
        // only running when we need to draw onto screen
        markers = markers.filter((v, i, a) => i === a.findIndex(t => t.ip === v.ip))

        markers.forEach(v => {
            map.addMarker({ lon: v.lon, lat: v.lat, color: v.color, char: v.char })
        })
    } else {
        map.clearMarkers()
    }

    screen.render()
    on = !on
}

// Actual location drawing manager
//
// first finds this machine's IP & draws it
// then invokes middleware supplied
// and enables location marker flashing mechanism
const worker = (map, screen, fn) => getMyIP().then(ip => {
    let resp = lookup(ip)
    if (validateLookup(resp)) {
        // cached host machine IP
        markers.push({ ...resp, color: 'red', char: 'X' })
        // adding this machine's location onto map
        addMarkerAndRender(resp.lon, resp.lat, 'red', 'X', map, screen)
    }

    // middleware to be invoked
    fn(map, screen)

    // flash every .5 seconds
    setInterval(enableFlashEffect, 500, map, screen)
})

// initial rendering to be done here, on created
// screen handler; middleware set up & exit mechanism set up, 
// also to be done here i.e. whole application UI setup to be made here
const render = fn => {
    const screen = blessed.screen()
    const map = contrib.map({ label: 'Searching ...', style: { shapeColor: 'cyan' } })

    screen.append(map)
    worker(map, screen, fn)

    // pressing {esc, q, ctrl+c}, results into exit with success i.e. return value 0
    screen.key(['escape', 'q', 'C-c'], (ch, key) => {
        screen.destroy()
        logger().then(v => {
            console.log(`${v}`.green)
            process.exit(0)
        }).catch(e => {
            console.log(`${e}`.red)
            process.exit(1)
        })
    })
    // first screen render
    screen.render()
}

// checks whether platform on which this tool 
// is being run, is either of {linux, darwin},
// otherwise, returns false
const checkForSupportedPlatform = _ => {
    const plt = platform()
    if (plt === 'linux' || plt === 'darwin') {
        return true
    }

    console.log('[!]Command not supported on platform'.red)
    process.exit(0)
}

// given domain name, finds out all ipv4/ 6 addresses using dns.resolve*
// function, in case of bad domain names, promise to be rejected
const domainToIP = domain => new Promise((resolve, reject) => {
    const addrs = []

    // first look up ipv4 addresses for given domain name
    dns.resolve4(domain, (err, _addrs) => {
        if (err !== undefined && err !== null) {
            return reject(err.code)
        }
        addrs.push(..._addrs)

        // then go for resolving ipv6 addresses, as not
        // all domains may support ipv6, which is why, we're
        // going to not destroy application if case of failure here, because
        // it's guaranteed that domain name exists if control of execution
        // has come to this point
        dns.resolve6(domain, (err, _addrs) => {
            if (err === undefined || err === null) {
                addrs.push(...addrs)
            }

            return resolve(addrs)
        })

    })
})

// logs all found peers ( including itself ), on console,
// for all commands
//
// this section needs to be improved, by adding on-map live logging support
const logger = _ => new Promise((resolve, reject) => {
    console.log('\n')
    console.table(markers, ['ip', 'lon', 'lat', 'region', 'country'])
    console.log('\n')

    // dumping json output to dump file
    // where we'll put all peers
    // which were shown on map
    writeFile(argv.dump, JSON.stringify({
        dump: markers.map(v => {
            return {
                ip: v.ip,
                lon: v.lon,
                lat: v.lat,
                region: v.region,
                country: v.country
            }
        })
    }, null, '\t'), err => {
        if (err) {
            reject('[~]Failed to dump')
        } else {
            resolve(`[+]Dumped into ${argv.dump}`)
        }
    })
})


const argv = require('yargs').scriptName('lenz'.magenta)
    .usage(`${'[+]Author  :'.bgGreen} Anjan Roy < anjanroy@yandex.com >\n${'[+]Project :'.bgGreen} https://github.com/itzmeanjan/lenz`)
    .command('lm <magnet> <db> [dump]', 'Find peers by Torrent Infohash', {
        magnet: { describe: 'torrent 🧲 link', type: 'string' },
        db: { describe: 'path to ip2location-db5.bin', type: 'string' },
        dump: { describe: 'path to sink-file.json', type: 'string', default: 'dump.json' }
    }, argv => {
        checkDB5Existance(argv.db)
        const infoHash = checkMagnetLinkValidation(argv.magnet)

        // initialized ip2location db5 database
        init(argv.db)
        render((map, screen) => {
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
                    markers.push({ ...resp, color: 'magenta', char: 'o' })
                    // adding peer location in map
                    addMarkerAndRender(resp.lon, resp.lat, 'magenta', 'o', map, screen)
                }
            })

            // requesting dht to lookup use provided magnet link's infoHash
            dht.lookup(infoHash)
        })
    })
    .command('ld <domain> <db> [dump]', 'Find location of Domain Name',
        {
            domain: { describe: 'domain name to be looked up', type: 'string' },
            db: { describe: 'path to ip2location-db5.bin', type: 'string' },
            dump: { describe: 'path to sink-file.json', type: 'string', default: 'dump.json' }
        }, argv => {
            checkDB5Existance(argv.db)
            checkDomainNameValidation(argv.domain)

            init(argv.db)
            render((map, screen) => {

                domainToIP(argv.domain).then(v => {
                    v.map(v => lookup(v)).filter(validateLookup).forEach(v => {
                        // cached remote machine IP
                        markers.push({ ...v, color: 'magenta', char: 'o' })
                        // adding remote machine's location into map
                        addMarkerAndRender(v.lon, v.lat, 'magenta', 'o', map, screen)
                    })

                    console.log('Successful look up'.green)
                }).catch(e => {
                    screen.destroy()
                    console.log('[!]Domain name look up failed'.red)
                    process.exit(1)
                })

            })
        })
    .command('lp <ip> <db> [dump]', 'Find location of IP Address',
        {
            ip: { describe: 'IP Address to be located', type: 'string' },
            db: { describe: 'path to ip2location-db5.bin', type: 'string' },
            dump: { describe: 'path to sink-file.json', type: 'string', default: 'dump.json' }
        }, argv => {
            checkDB5Existance(argv.db)
            checkIPAddressValidation(argv.ip)

            init(argv.db)
            render((map, screen) => {
                let resp = lookup(argv.ip)
                if (validateLookup(resp)) {
                    // cached target machine IP
                    markers.push({ ...resp, color: 'magenta', char: 'o' })
                    // adding target machine's location into map
                    addMarkerAndRender(resp.lon, resp.lat, 'magenta', 'o', map, screen)
                }

                console.log('Successful look up'.green)
            })
        })
    .command('ls <db> [dump]', 'Find location of open TCP/UDP socket peer(s)',
        {
            db: { describe: 'path to ip2location-db5.bin', type: 'string' },
            dump: { describe: 'path to sink-file.json', type: 'string', default: 'dump.json' }
        }, argv => {
            checkDB5Existance(argv.db)
            // this command is only supported in macos & gnu/linux
            checkForSupportedPlatform()

            init(argv.db)
            render((map, screen) => {
                getTCPAndUDPPeers().then(v => {
                    v.forEach(v => {
                        if (isIP(v)) {
                            let resp = lookup(v)
                            if (validateLookup(resp)) {
                                // cached remote machine IP
                                markers.push({ ...resp, color: 'magenta', char: 'o' })
                                // adding remote machine's location into map
                                addMarkerAndRender(resp.lon, resp.lat, 'magenta', 'o', map, screen)
                            }
                        }
                        else if (isValidDomain(v)) {
                            domainToIP(v).then(v => {

                                v.map(v => lookup(v)).filter(validateLookup).forEach(v => {
                                    // cached remote machine IP
                                    markers.push({ ...v, color: 'magenta', char: 'o' })
                                    // adding remote machine's location into map
                                    addMarkerAndRender(v.lon, v.lat, 'magenta', 'o', map, screen)
                                })

                            }).catch(e => {
                                // doing nothing as of now
                            })
                        }
                    })

                    console.log('Successful look up'.green)
                }).catch(e => {
                    screen.destroy()
                    console.log('[!]Failed to find open socket(s)'.red)
                    process.exit(1)
                })
            })
        })
    .command('lr <url> <db> [dump]', 'Locate static content delivery domain(s) used by URL',
        {
            url: { describe: 'inspect for finding static content delivery domain(s)', type: 'string' },
            db: { describe: 'path to ip2location-db5.bin', type: 'string' },
            dump: { describe: 'path to sink-file.json', type: 'string', default: 'dump.json' }
        }, argv => {
            checkDB5Existance(argv.db)

            init(argv.db)
            render((map, screen) => {
                getHTML(argv.url).then(v => {

                    mergetTwoSets(extractDomainNamesFromURLs(extractCSSResources(v)),
                        extractDomainNamesFromURLs(extractScriptResources(v))).forEach(v => {

                            domainToIP(v).then(v => {

                                v.map(v => lookup(v)).filter(validateLookup).forEach(v => {
                                    // cached remote machine IP
                                    markers.push({ ...v, color: 'magenta', char: 'o' })
                                    // adding remote machine's location into map
                                    addMarkerAndRender(v.lon, v.lat, 'magenta', 'o', map, screen)
                                })

                            }).catch(e => {
                                // doing nothing as of now
                            })

                        })
                    console.log('Successful look up'.green)

                }).catch(_ => {
                    screen.destroy()
                    console.log('[!]URL lookup failed'.red)
                    process.exit(1)
                })

            })
        })
    .demandCommand().help().wrap(72).argv
