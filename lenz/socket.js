const { spawn } = require('child_process')

// runs lsof command for finding all active socket connections
// both tcp & udp connections are listed
// it's run in async mode on different child process
const lsof = _ => new Promise((resolve, reject) => {
    let buffer
    const lsof = spawn('lsof', ['-i'])

    lsof.stdout.on('data', d => {
        buffer = d.toString()
    })
    lsof.on('close', code => {
        if (code !== 0) {
            reject(code)
        }
        resolve(buffer)
    })
})

// runs awk pattern matcher for extracting certain
// fields of data, where IP address of connected peers
// using socket are listed
// actually this one uses output of previous function & extracts only
// fields of interest
const awk_0 = data => new Promise((resolve, reject) => {
    let buffer
    const awk = spawn('awk', ['{ print $9 }'])

    awk.stdout.on('data', d => {
        buffer = d.toString()
    })
    awk.on('close', code => {
        if (code !== 0) {
            reject(code)
        }
        resolve(buffer)
    })

    awk.stdin.write(data, _ => {
        awk.stdin.end()
    })
})

// another pattern extractor using awk, where we try to
// extract out only destination machine's address ( ipv4/ 6 )
// for each of active socket connections.
const awk_1 = data => new Promise((resolve, reject) => {
    let buffer
    const awk = spawn('awk', ['/.*->/{ print $1 }'])

    awk.stdout.on('data', d => {
        buffer = d.toString()
    })
    awk.on('close', code => {
        if (code !== 0) {
            reject(code)
        }
        resolve(buffer)
    })

    awk.stdin.write(data, _ => {
        awk.stdin.end()
    })
})

const getTCPAndUDPPeers = _ => new Promise((resolve, reject) => {
    lsof().then(v => awk_0(v).then(v => awk_1(v).then(resolve).catch(reject)).catch(reject)).catch(reject)
})

module.exports = {
    getTCPAndUDPPeers
}
