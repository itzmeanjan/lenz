const { createReadStream } = require('fs')
const { createInterface } = require('readline')
const { resolve } = require('path')
const { IPv4Range } = require('./range')

// Given ASN & ip2location asn database, returns a list 
// of all those ipv4 address ranges, which are controlled & owned by
// this ASN
//
// glass is nothing but a function, when ipv4/6 address is passed, can
// return geolocation using ip2location db5 free database
const findByASN = (db, asn, glass) => new Promise((res, rej) => {
    const buffer = []
    let reader = createInterface({
        input: createReadStream(resolve(db)),
        output: process.stdout,
        terminal: false
    })

    reader.on('line', ln => {
        const record = ln.split(',').map(v => v.slice(1, -1))
        if (record[3] === `${asn}`) {
            buffer.push([new IPv4Range(...record.slice(0, 2), glass), ...record.slice(3)])
        }
    })
    reader.on('close', _ => {
        res(buffer)
    })
})

// Given ip2location asn database file path, asn to searched & function
// to lookup geolocation of ip address, we can find out all geolocation
// of ip addresses, handled by this ASN
const geoIPFromASN = (db, asn, glass) => new Promise((res, rej) => {
    const buffer = []

    findByASN(db, asn, glass).then(v => {
        v.map(v => v[0]).forEach(v => {
            for (let i of v.all()) {
                buffer.push(i)
            }
        })

        res({
            asn: v[0][2],
            as: v[0][1],
            ip: buffer
                .filter((v, i, a) => i === a.findIndex(t => t.lon === v.lon && t.lat === v.lat))
        })
    }).catch(rej)
})

module.exports = {
    geoIPFromASN
}
