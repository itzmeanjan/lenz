const { spawn } = require('child_process')

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

const awk = data => new Promise((resolve, reject) => {
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

    awk.stdin.write(data, e => {
        awk.stdin.end()
    })
})

const getTCPAndUDPPeers = _ => new Promise((resolve, reject) => {
    lsof().then(v => awk(v).then(v => resolve(v)).catch(reject)).catch(reject)
})

module.exports = {
    getTCPAndUDPPeers
}
