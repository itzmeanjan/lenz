const { spawn } = require('child_process')

// running lsof -i command on console, 
// on a different process in async mode
//
// returning string representation of data
const lsof = _ => new Promise((resolve, reject) => {
    let buffer = null
    const lsof = spawn('lsof', ['-i'])

    lsof.stdout.on('data', d => { buffer = d })

    lsof.on('close', code => {
        if (code !== 0) {
            reject(code)
        }

        resolve(buffer.toString())
    })
})

const getTCPAndUDPPeers = _ => new Promise((resolve, reject) => {
    const buffer = []
    const lsof = spawn('lsof', ['-i'])

    lsof.stdout.on('data', d => {
        buffer.push(d)
    })

    lsof.on('close', code => {
        if (code !== 0) {
            reject(code)
        }

        resolve(buffer)
    })
})

module.exports = {
    getTCPAndUDPPeers
}
