const { spawn } = require('child_process')

const getTCPAndUDPPeers = _ => new Promise((resolve, reject) => {
    let buffer
    const lsof = spawn('lsof', ['-i'])
    const awk = spawn('awk', ['{ print $9 }'])

    lsof.stdout.on('data', d => {
        awk.stdin.write(d.toString())
    })
    lsof.on('close', code => {
        if (code !== 0) {
            reject(code)
        }
        awk.stdin.end()
    })

    awk.stdout.on('data', d => {
        buffer = d.toString()
    })
    awk.on('close', code => {
        if (code !== 0) {
            reject(code)
        }
        resolve(buffer)
    })
})

module.exports = {
    getTCPAndUDPPeers
}
