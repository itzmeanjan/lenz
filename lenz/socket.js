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
    const awk = spawn('awk', ['{ print $1, $9 }'])

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
    const awk = spawn('awk', ['/.*->.*/{ print $0 }'])

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

// this function is capable of extracting out all currently connected TCP/ UDP
// connection peer address/ domain names, along with respective application
// which is using this connection for passing in/ out data
//
// this output to be used in console map, to provide a better live visualization
// capability
//
// this function is going to return a event stream, listen to `peers` event
// where an array of currently connected peers to be returned
// & consider updating consuming application as soon as new data comes in
const getTCPAndUDPPeers = _ => {
    const watcher = _ => new Promise((resolve, reject) => {
        lsof().then(awk_0).then(awk_1).then(v =>
            resolve(v.split('\n')
                .filter(v => v.length !== 0)
                .map(v => v.split(' '))
                .map(v => [
                    v[0],
                    v[1].replace(/.*->/, '').split(':').slice(0, -1).join(':').replace(/\[|\]/g, '')
                ])
                .filter((v, i, a) => i === a.findIndex(t => t[0] === v[0] && t[1] === v[1]))))
            .catch(reject).catch(reject).catch(reject)
    })

    const stream = new EventEmitter()
    // this async block keeps running watcher, which will
    // keep querying system about what are tcp/ udp peers are connected to machine, currently
    const worker = async (stream) => {
        while (true) {
            try {
                const peers = await watcher()
                stream.emit('peers', peers)
            } catch (e) {
                stream.emit('error', e)
            }
        }
    }

    // and here we invoke worker, which is going for one infinite iteration
    worker(stream)
    return stream
}

module.exports = {
    getTCPAndUDPPeers
}
