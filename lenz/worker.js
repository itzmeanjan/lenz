const { parentPort, workerData } = require('worker_threads')
const { init, lookup } = require('./locate')
const { geoIPFromASN } = require('./asn')

// checks whether IP address look up is valid or not
const validateLookup = data => !(data.lon === 0 && data.lat === 0 && data.region === '-' && data.country === '-')

// initializes ip2location db5 database
init(workerData.db)

// issue lookup worker for `asn`
// which will find out all IP addresses controlled by this Autonomous System
// and geo locate this using db5 database, which are to be rendered on console map
const listener = geoIPFromASN(workerData.asndb, workerData.asn, lookup)

// when ever new ip address is found with location info, that's sent to parent worker using message channel
listener.on('ip', v => { if (validateLookup(v)) { parentPort.postMessage(v) } })
// when all lookup is done, message channel is closed
listener.once('asn', v => { parentPort.close() })
// throws error on occurance of some issue in main worker, which is notified to main listener on main thread
listener.on('error', e => { process.exit(1) })
