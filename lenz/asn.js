const { createReadStream } = require('fs')
const { createInterface } = require('readline')
const { resolve } = require('path')

// Given ASN & ip2location asn database, returns a list 
// of all those ipv4 address ranges, which are controlled & owned by
// this ASN
const findByASN = (db, asn) => new Promise((res, rej) => {
    createInterface({
        input: createReadStream(resolve(db)),
        output: process.stdout,
        terminal: false
    }).addListener('line', ln => {
        console.log(ln.split(','))
    })
})

module.exports = {
    findByASN
}
