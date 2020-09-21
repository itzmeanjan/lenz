const { parentPort, workerData } = require('worker_threads')
const { init, lookup } = require('./locate')
const { geoIPFromASN } = require('./asn')
const { getMyIP } = require('./ip')

const validateLookup = data => !(data.lon === 0 && data.lat === 0 && data.region === '-' && data.country === '-')

init(workerData.db)

getMyIP().then(v => {
    let resp = lookup(v)
    if (validateLookup(resp)) {
        parentPort.postMessage(resp)
    }

    const listener = geoIPFromASN(workerData.asndb, workerData.asn, lookup)
    listener.on('ip', v => { parentPort.postMessage(v) })
    listener.once('asn', v => { parentPort.close() })
    listener.on('error', e => { throw new Error(e) })

}).catch(e => { throw new Error(e) })
