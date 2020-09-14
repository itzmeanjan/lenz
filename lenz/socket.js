const { spawn } = require('child_process')

const getTCPAndUDPPeers = _ => new Promise((resolve, reject) => {
    const lsof = spawn('lsof', ['-i'])
    const buffer = []

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

