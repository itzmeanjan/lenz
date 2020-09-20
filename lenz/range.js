const { Address4 } = require('ip-address')

class IPv4Range {

    // ipv4 address range, where from & two both are integers
    constructor(from, to) {
        this.from = from
        this.to = to
    }

    // generate all ipv4 addresses as lazy stream, within this range
    all() {
        for (let cur = this.from; cur <= this.to; cur++) {
            yield Address4.fromInteger(i).address
        }
    }

}
