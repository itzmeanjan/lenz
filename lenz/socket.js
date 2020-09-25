const { spawn } = require('child_process')
const { EventEmitter } = require('events')

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
            return reject(code)
        }
        return resolve(buffer)
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
            return reject(code)
        }
        return resolve(buffer)
    })

    awk.stdin.write(data, _ => {
        awk.stdin.end()
    })
})

// another pattern extractor using awk, where we try to
// extract out only those addresses which are 
// valid ip addresses either ipv4/ 6/ (sub-)domain names
const awk_1 = data => new Promise((resolve, reject) => {
    let buffer
    const awk = spawn('awk', ['/.*->/{ print $1 }'])

    awk.stdout.on('data', d => {
        buffer = d.toString()
    })
    awk.on('close', code => {
        if (code !== 0) {
            return reject(code)
        }
        return resolve(buffer)
    })

    awk.stdin.write(data, _ => {
        awk.stdin.end()
    })
})

// another pattern extractor using awk, where we try to
// extract out only destination machine's address ( ipv4/ 6 )/ domain name
// for each of active socket connections.
const awk_2 = data => new Promise((resolve, reject) => {
    let buffer
    const awk = spawn('awk', ['-F', '->', '{ print $2 }'])

    awk.stdout.on('data', d => {
        buffer = d.toString()
    })
    awk.on('close', code => {
        if (code !== 0) {
            return reject(code)
        }
        return resolve(buffer)
    })

    awk.stdin.write(data, _ => {
        awk.stdin.end()
    })
})

// extracts all tcp/ udp peer addresses ( ip address/ domain name/ sub-domain name )
// to which this machine is currently talking to
// and returns an array of them, which can be used for looking up
// their respective location & then to be drawn on 
// map [ which is our final objective i.e. visualization of connected socket peers on console map : lenz ]
const getTCPAndUDPPeers = _ => {
    const watcher = _ => new Promise((resolve, reject) => {
        lsof().then(v => awk_0(v)
            .then(v => awk_1(v)
                .then(v => awk_2(v).then(v => resolve(v.split('\n').filter(v => v.length !== 0)
                    .map(v => v.split(':').slice(0, -1).join(':').replace(/\[|\]/g, ''))))
                    .catch(reject)).catch(reject))
            .catch(reject)).catch(reject)
    })

    const stream = new EventEmitter()
    const worker = (stream) => {
        watcher().then(v => {
            stream.emit('peers', v)

            setTimeout(worker, 2000, [stream])
        }).catch(e => stream.emit('error', e))
    }
    return stream
}

module.exports = {
    getTCPAndUDPPeers
}
