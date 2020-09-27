const magnet = require('magnet-uri')
const { existsSync } = require('fs')
const isValidDomain = require('is-valid-domain')
const { isIP } = require('net')

// validating user given torrent magnet link
const checkMagnetLinkValidation = _magnet => {
    const parsed = magnet(_magnet)
    if (!parsed.infoHash) {
        console.log('[!]Bad Torrent 🧲 Link'.red)
        process.exit(1)
    }

    return parsed.infoHash
}

// checking existance of local ip2location db file {*.bin, *.csv}
// if not present, exit process with return code 1
const checkDBExistance = db => {
    if (!existsSync(db)) {
        console.log('[!]Can\'t find IP2Location Database'.red)
        process.exit(1)
    }
}

// checking whether supplied domain name is valid or not
// if not, exit process with return code 1
const checkDomainNameValidation = domain => {
    if (!isValidDomain(domain)) {
        console.log('[!]Invalid domain name'.red)
        process.exit(1)
    }
}

// validates looked up ip address info, because in case of
// private ip addresses it'll return longitude & latitude fields as `0` & region & country as `-`
const validateLookup = data => !(data.lon === 0 && data.lat === 0 && data.region === '-' && data.country === '-')

// validates user provided IPv{4,6} address
const checkIPAddressValidation = ip => {
    if (!isIP(ip)) {
        console.log('[!]Invalid IP Address'.red)
        process.exit(1)
    }
}

module.exports = {
    checkMagnetLinkValidation,
    checkDBExistance,
    checkDomainNameValidation,
    validateLookup,
    checkIPAddressValidation
}
