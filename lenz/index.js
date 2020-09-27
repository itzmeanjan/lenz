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
const { join } = require('path')

const { getMyIP } = require('./ip')
const { init, lookup } = require('./locate')
const { getHTML, extractCSSResources, extractScriptResources, extractImageResources, extractDomainNamesFromURLs, mergetTwoSets } = require('./resources')
const { Worker } = require('worker_threads')

// validating user given torrent magnet link
const checkMagnetLinkValidation = _magnet => {
    const parsed = magnet(_magnet)
    if (!parsed.infoHash) {
        console.log('[!]Bad Torrent 🧲 Link'.red)
        process.exit(1)
    }

    return parsed.infoHash
}

// checking existance of local ip2location db file {*.bin, *.csv}
// if not present, exit process with return code 1
const checkDBExistance = db => {
    if (!existsSync(db)) {
        console.log('[!]Can\'t find IP2Location Database'.red)
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
const worker = (map, table, screen, fn) => getMyIP().then(ip => {
    let resp = lookup(ip)
    if (validateLookup(resp)) {
        // cached host machine IP
        markers.push({ ...resp, color: 'red', char: 'X' })

        // putting this machine's location info onto table
        table.setData({
            headers: ['Address', 'Longitude', 'Latitude', 'Region', 'Country'],
            data: markers.map(v => [v.ip, v.lon, v.lat, v.region, v.country])
        })

        // adding this machine's location onto map
        addMarkerAndRender(resp.lon, resp.lat, 'red', 'X', map, screen)
    }

    // middleware to be invoked
    fn(map, table, screen)

    // flash every .5 seconds
    setInterval(enableFlashEffect, 500, map, screen)
})

// initial rendering to be done here, on created
// screen handler; middleware set up & exit mechanism set up, 
// also to be done here i.e. whole application UI setup to be made here
const render = fn => {
    const screen = blessed.screen()
    const grid = new contrib.grid({ rows: 12, cols: 1, screen: screen })
    const map = grid.set(0, 0, 10, 1, contrib.map, { label: 'Searching ...', style: { shapeColor: 'cyan' } })
    const table = grid.set(10, 0, 2, 1, contrib.table, {
        keys: true
        , vi: true
        , fg: 'white'
        , selectedFg: 'green'
        , selectedBg: 'black'
        , interactive: true
        , label: 'Connected Peer(s)'
        , width: '100%'
        , height: '95%'
        , border: { type: "line", fg: "cyan" }
        , columnSpacing: 10
        , columnWidth: [36, 10, 10, 40, 30]
    })
    table.focus()

    worker(map, table, screen, fn)

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
        checkDBExistance(argv.db)
        const infoHash = checkMagnetLinkValidation(argv.magnet)

        // initialized ip2location db5 database
        init(argv.db)
        render((map, table, screen) => {
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

                    // putting peer location info onto table
                    table.setData({
                        headers: ['Address', 'Longitude', 'Latitude', 'Region', 'Country'],
                        data: markers
                            .filter((v, i, a) => i === a.findIndex(t => t.ip === v.ip))
                            .map(v => [v.ip, v.lon, v.lat, v.region, v.country])
                    })

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
            checkDBExistance(argv.db)
            checkDomainNameValidation(argv.domain)

            init(argv.db)
            render((map, table, screen) => {

                domainToIP(argv.domain).then(v => {
                    v.map(v => lookup(v)).filter(validateLookup).forEach(v => {
                        // cached remote machine IP
                        markers.push({ ...v, color: 'magenta', char: 'o' })

                        table.setData({
                            headers: ['Address', 'Longitude', 'Latitude', 'Region', 'Country'],
                            data: markers.map(v => [v.ip, v.lon, v.lat, v.region, v.country])
                        })

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
            checkDBExistance(argv.db)
            checkIPAddressValidation(argv.ip)

            init(argv.db)
            render((map, table, screen) => {
                let resp = lookup(argv.ip)
                if (validateLookup(resp)) {
                    // cached target machine IP
                    markers.push({ ...resp, color: 'magenta', char: 'o' })

                    table.setData({
                        headers: ['Address', 'Longitude', 'Latitude', 'Region', 'Country'],
                        data: markers.map(v => [v.ip, v.lon, v.lat, v.region, v.country])
                    })

                    // adding target machine's location into map
                    addMarkerAndRender(resp.lon, resp.lat, 'magenta', 'o', map, screen)
                }

                console.log('Successful look up'.green)
            })
        })
    // this command is only supported in darwin & gnu/linux
    // due to the fact, it uses lsof & awk, these two unix utilities
    .command('ls <db> [dump]', 'Find location of connected TCP/UDP socket peer(s)',
        {
            db: { describe: 'path to ip2location-db5.bin', type: 'string' },
            dump: { describe: 'path to sink-file.json', type: 'string', default: 'dump.json' }
        }, argv => {
            checkDBExistance(argv.db)
            checkForSupportedPlatform()

            init(argv.db)

            const screen = blessed.screen()
            const grid = new contrib.grid({ rows: 12, cols: 1, screen: screen })
            const map = grid.set(0, 0, 10, 1, contrib.map, { label: 'Scanning ...', style: { shapeColor: 'cyan' } })
            const table = grid.set(10, 0, 2, 1, contrib.table, {
                keys: true
                , vi: true
                , fg: 'white'
                , selectedFg: 'green'
                , selectedBg: 'black'
                , interactive: true
                , label: 'TCP/ UDP Peer(s)'
                , width: '100%'
                , height: '95%'
                , border: { type: "line", fg: "cyan" }
                , columnSpacing: 10
                , columnWidth: [20, 48, 10, 10, 40, 30]
            })
            table.focus()

            getMyIP().then(ip => {
                let resp = lookup(ip)
                if (validateLookup(resp)) {
                    // cached host machine IP
                    markers.push({ ...resp, color: 'red', char: 'X', app: '-' })

                    // putting this machine's location info onto table
                    table.setData({
                        headers: ['App', 'Address', 'Longitude', 'Latitude', 'Region', 'Country'],
                        data: markers.map(v => [v.app, v.ip, v.lon, v.lat, v.region, v.country])
                    })

                    // adding this machine's location onto map
                    addMarkerAndRender(resp.lon, resp.lat, 'red', 'X', map, screen)
                }

                // using this we can start listening to {peers, error} events
                const listener = getTCPAndUDPPeers()

                listener.on('peers', v => {
                    // as this listener will keep receiving data here after each successful system query
                    // we can't keep pushing new peer addresses in existing collection
                    //
                    // rather we're going to empty current cache & make it ready for next one
                    // except very first element, because we're interested in keeping this
                    // machine location info cached
                    if (markers.length !== 0) {
                        markers = markers.slice(0, 1)
                    }

                    v.forEach(v => {
                        const record = v

                        if (isIP(record[1])) {
                            let resp = lookup(record[1])
                            if (validateLookup(resp)) {
                                // cached remote machine IP
                                markers.push({ ...resp, color: 'magenta', char: 'o', app: record[0] })
                                // adding remote machine's location into map
                                addMarkerAndRender(resp.lon, resp.lat, 'magenta', 'o', map, screen)
                            }

                            // putting peer location info onto table
                            table.setData({
                                headers: ['App', 'Address', 'Longitude', 'Latitude', 'Region', 'Country'],
                                data: markers.map(v => [v.app, v.ip, v.lon, v.lat, v.region, v.country])
                            })
                        }
                        else if (isValidDomain(record[1])) {
                            domainToIP(record[1]).then(v => {

                                v.map(v => lookup(v)).filter(validateLookup).forEach(v => {
                                    // cached remote machine IP
                                    markers.push({ ...v, color: 'magenta', char: 'o', app: record[0] })

                                    // putting peer location info onto table
                                    table.setData({
                                        headers: ['App', 'Address', 'Longitude', 'Latitude', 'Region', 'Country'],
                                        data: markers
                                            .filter((v, i, a) => i === a.findIndex(t => t.app === v.app && t.ip === v.ip))
                                            .map(v => [v.app, v.ip, v.lon, v.lat, v.region, v.country])
                                    })

                                    // adding remote machine's location into map
                                    addMarkerAndRender(v.lon, v.lat, 'magenta', 'o', map, screen)
                                })

                            }).catch(_ => { })
                        }
                    })
                })
                listener.on('error', e => {
                    // stopping listening to event stream first
                    listener.off('peers')
                    listener.off('error')

                    screen.destroy()
                    console.log('[!]System scan failed'.red)
                    process.exit(1)
                })

                // flash every .5 seconds
                setInterval(enableFlashEffect, 500, map, screen)
            })

            // pressing {esc, q, ctrl+c}, results into exit with success i.e. return value 0
            screen.key(['escape', 'q', 'C-c'], (ch, key) => {
                screen.destroy()

                console.log('\n')
                console.table(markers, ['app', 'ip', 'lon', 'lat', 'region', 'country'])
                console.log('\n')

                // dumping json output to dump file
                // where we'll put all peers
                // which were shown on map
                writeFile(argv.dump, JSON.stringify({
                    dump: markers.map(v => {
                        return {
                            app: v.app,
                            ip: v.ip,
                            lon: v.lon,
                            lat: v.lat,
                            region: v.region,
                            country: v.country
                        }
                    })
                }, null, '\t'), err => {
                    if (err) {
                        console.log('[~]Failed to dump'.red)
                        process.exit(0)
                    } else {
                        console.log(`[+]Dumped into ${argv.dump}`.green)
                        process.exit(1)
                    }
                })
            })
            // first screen render
            screen.render()

        })
    .command('lr <url> <db> [dump]', 'Locate static content delivery domain(s) used by URL',
        {
            url: { describe: 'inspect for finding static content delivery domain(s)', type: 'string' },
            db: { describe: 'path to ip2location-db5.bin', type: 'string' },
            dump: { describe: 'path to sink-file.json', type: 'string', default: 'dump.json' }
        }, argv => {
            checkDBExistance(argv.db)

            init(argv.db)
            render((map, table, screen) => {
                getHTML(argv.url).then(v => {

                    mergetTwoSets(extractDomainNamesFromURLs(extractImageResources(v)),
                        mergetTwoSets(extractDomainNamesFromURLs(extractCSSResources(v)),
                            extractDomainNamesFromURLs(extractScriptResources(v)))).forEach(v => {

                                domainToIP(v).then(v => {

                                    v.map(v => lookup(v)).filter(validateLookup).forEach(v => {
                                        // cached remote machine IP
                                        markers.push({ ...v, color: 'magenta', char: 'o' })

                                        // putting peer location info onto table
                                        table.setData({
                                            headers: ['Address', 'Longitude', 'Latitude', 'Region', 'Country'],
                                            data: markers
                                                .filter((v, i, a) => i === a.findIndex(t => t.ip === v.ip))
                                                .map(v => [v.ip, v.lon, v.lat, v.region, v.country])
                                        })

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
    .command('la <asn> <db> <asndb> [dump]', 'Geo locate IPv4 addresses owned by Autonomous System',
        {
            asn: { describe: 'autonomous system number to be looked up', type: 'int' },
            db: { describe: 'path to ip2location-db5.bin', type: 'string' },
            asndb: { describe: 'path to ip2location-ipv4-asn.db', type: 'string' },
            dump: { describe: 'path to sink-file.json', type: 'string', default: 'dump.json' }
        }, argv => {
            checkDBExistance(argv.db)
            checkDBExistance(argv.asndb)

            init(argv.db)
            render((map, table, screen) => {

                const worker = new Worker(join(__dirname, 'worker.js'), { workerData: { db: argv.db, asndb: argv.asndb, asn: argv.asn } })
                worker.on('message', m => {
                    markers.push({ ...m, color: 'magenta', char: 'o' })

                    table.setData({
                        headers: ['Address', 'Longitude', 'Latitude', 'Region', 'Country'],
                        data: markers.map(v => [v.ip, v.lon, v.lat, v.region, v.country])
                    })

                    addMarkerAndRender(m.lon, m.lat, 'magenta', 'o', map, screen)
                })
                worker.on('error', e => {
                    if (e) {
                        screen.destroy()
                        console.log(`${e}`.red)
                        process.exit(1)
                    }
                })
                worker.on('exit', c => {
                    if (c !== 0) {
                        screen.destroy()
                        console.log(`Something went wrong`.red)
                        process.exit(1)
                    } else {
                        console.log('Successful look up'.green)
                    }
                })

            })

        })
    .demandCommand().help().wrap(72).argv
