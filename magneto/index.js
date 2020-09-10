#!/usr/bin/env node

const yargs = require('yargs')
const blessed = require('blessed')
const contrib = require('blessed-contrib')
const magnet = require('magnet-uri')
colors = require('colors')

const { getMyIP } = require('./ip')
const { lookup } = require('./locate')

const validateLookup = data => !(data.lon === 0 && data.lat === 0 && data.region === '-' && data.country === '-')

const options = yargs
    .usage("Usage: -m <magnet>")
    .option("m", { alias: "magnet", describe: "Torrent 🧲 Link", type: "string", demandOption: true })
    .argv;

const parsed = magnet(options.m)
if(!parsed.infoHash) {
    console.log('[!]Bad Torrent 🧲 Link'.red)
    process.exit(1)
}

const screen = blessed.screen()
const map = contrib.map({ label: 'World Map', style: { shapeColor: 'cyan' } })

screen.append(map)

getMyIP().then(ip => {
    let resp = lookup(ip)
    if (validateLookup(resp)) {
        map.addMarker({ lon: resp.lon, lat: resp.lat, color: "red", char: "X" })
        screen.render()
    }
})

screen.key(['escape', 'q', 'C-c'], (ch, key) => process.exit(0))
screen.render()
