const { createReadStream } = require('fs')
const { createInterface } = require('readline')
const { resolve } = require('path')

// Given ASN & ip2location asn database, returns a list 
// of all those ipv4 address ranges, which are controlled & owned by
// this ASN
const findByASN = (db, asn) => new Promise((res, rej) => {
    const buffer = []
    let reader = createInterface({
        input: createReadStream(resolve(db)),
        output: process.stdout,
        terminal: false
    })

    reader.on('line', ln => {
        const record = ln.split(',').map(v => v.slice(1, -1))
        if (record[3] === asn) {
            buffer.push([...record.slice(0, 2), ...record.slice(3)])
        }
    })
    reader.on('close', _ => {
        res(buffer)
    })
})

module.exports = {
    findByASN
}
