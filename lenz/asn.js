const { readFile } = require('fs')
const { resolve } = require('path')

const findByASN = (db, asn) => new Promise((res, rej) => {
    readFile(resolve(db), (err, data) => {
        if (err) {
            rej(err)
        }

        res(data.toString()
            .split('\n')
            .map(v => v.split(','))
            .filter(v => v[3] === asn)
            .map(v => [v[0], v[1], v[3], v[4]]))
    })
})

module.exports = {
    findByASN
}
