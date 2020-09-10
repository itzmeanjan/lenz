const blessed = require('blessed')
const contrib = require('blessed-contrib')

const {getMyIP} = require('./ip')
const {lookup} = require('./locate')

const screen = blessed.screen()
const map = contrib.map({ label: 'World Map', style: { shapeColor: 'cyan' } })

screen.append(map)

getMyIP().then(ip => {
    let resp  = lookup(ip)
    if(!resp) {
        map.addMarker({ "lon": resp.lon, "lat": resp.lat, color: "red", char: "X" })        
    }

    screen.render()
})

screen.key(['escape', 'q', 'C-c'], (ch, key) => process.exit(0))
