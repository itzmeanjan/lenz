const { spawn } = require('child_process')

// running lsof -i command on console, 
// on a different process in async mode
//
// returning string representation of data
const lsof = _ => new Promise((resolve, reject) => {
    let buffer
    const lsof = spawn('lsof', ['-i'])

    lsof.stdout.on('data', d => { buffer = d })
    lsof.on('close', code => {
        if (code !== 0) {
            reject(code)
        }

        resolve(buffer.toString())
    })
})

// running awk command with out put from `lsof` command
// in which some pattern matching to be performed
// for extracting useful information from certain column ( here 9-th )
const awk = data => new Promise((resolve, reject) => {
    let buffer
    const awk = spawn('awk', ["'{ print $9 }'"])

    awk.stdout.on('data', d => { buffer = d })
    awk.on('close', code => {
        if (code !== 0) {
            reject(code)
        }

        resolve(buffer.toString())
    })

    awk.stdin.write(data)
})

const getTCPAndUDPPeers = _ => new Promise((resolve, reject) => {
    lsof().then(v => { awk(v).then(resolve).catch(reject) }).catch(reject)
})

module.exports = {
    getTCPAndUDPPeers
}
