const { parentPort, workerData } = require('worker_threads')
const { init, lookup } = require('./locate')
const { geoIPFromASN } = require('./asn')
const { getMyIP } = require('./ip')

// checks whether IP address look up is valid or not
const validateLookup = data => !(data.lon === 0 && data.lat === 0 && data.region === '-' && data.country === '-')

// initializes ip2location db5 database
init(workerData.db)

// finds this machine's IP address
getMyIP().then(v => {
    // look up geo location info, of this machine's IP
    // using ip2location db5
    let resp = lookup(v)
    // validates IP geo location information
    if (validateLookup(resp)) {
        // `self` tag to be used for identify that this geo location information
        // is associated with this machine
        // so that will help us in distinguishing this machine in console map
        // with different color
        parentPort.postMessage({ ...resp, self: true })
    }

    // issue lookup worker for `asn`
    // which will find out all IP addresses controlled by this Autonomous System
    // and geo locate this using db5 database, which are to be rendered on console map
    const listener = geoIPFromASN(workerData.asndb, workerData.asn, lookup)
    // when ever new ip address is found with location info, that's sent to parent worker using message channel
    listener.on('ip', v => { if (validateLookup(v)) { parentPort.postMessage({ ...v, self: false }) } })
    // when all lookup is done, message channel is closed
    listener.once('asn', v => { parentPort.close() })
    // throws error on occurance of some issue in main worker, which is notified to main listener on main thread
    listener.on('error', e => { throw new Error(e) })

}).catch(e => { throw new Error(e) })
