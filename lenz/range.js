const { Address4 } = require('ip-address')

class IPv4Range {

    // ipv4 address range, where from & two both are integers
    // glass is like looking glass, for finding geo location data
    // of ip address, using ip2location db5
    // so glass is nothing but a function, when an ip address is passed
    // it can return location info
    constructor(from, to, glass) {
        this.from = from
        this.to = to
        this.glass = glass
    }

    // generate all ipv4 addresses as lazy stream, within this range
    *all() {
        for (let cur = this.from; cur <= this.to; cur++) {
            yield this.glass(Address4.fromInteger(cur).address)
        }
    }

}

module.exports = {
    IPv4Range
}
