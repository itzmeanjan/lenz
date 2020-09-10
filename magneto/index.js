#!/usr/bin/env node

const yargs = require('yargs')
const blessed = require('blessed')
const contrib = require('blessed-contrib')
const magnet = require('magnet-uri')
colors = require('colors')

const { getMyIP } = require('./ip')
const { lookup } = require('./locate')

// validates looked up ip address info, because in case of
// private ip addresses it'll return longitude & latitude fields as `0` & region & country as `-`
const validateLookup = data => !(data.lon === 0 && data.lat === 0 && data.region === '-' && data.country === '-')

// taking valid magnet link as input from user
const options = yargs
    .usage("Usage: -m <magnet>")
    .option("m", { alias: "magnet", describe: "Torrent 🧲 Link", type: "string", demandOption: true })
    .argv;

// if gets parsed properly & `infoHash` of torrent can
// be found, then we're good to go, otherwise, we'll exit
const parsed = magnet(options.m)
if(!parsed.infoHash) {
    console.log('[!]Bad Torrent 🧲 Link'.red)
    process.exit(1)
}

const screen = blessed.screen()
const map = contrib.map({ label: 'World Map', style: { shapeColor: 'cyan' } })

screen.append(map)

// obtaining ip address of this machine, by sending query to
// 'https://api.ipify.org?format=json'
getMyIP().then(ip => {
    let resp = lookup(ip)
    if (validateLookup(resp)) {
        // once location info available, adding this machine's location onto map
        map.addMarker({ lon: resp.lon, lat: resp.lat, color: "red", char: "X" })
        screen.render()
    }
})

// pressing {esc, q, ctrl+c}, results into exit with success i.e. return value 0
screen.key(['escape', 'q', 'C-c'], (ch, key) => process.exit(0))
screen.render()
