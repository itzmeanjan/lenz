const blessed = require('blessed')
const contrib = require('blessed-contrib')

const screen = blessed.screen()
const map = contrib.map({ label: 'World Map', style: { shapeColor: 'cyan' } })

screen.append(map)
map.addMarker({ "lon": "0", "lat": "0", color: "red", char: "*" })

screen.key(['escape', 'q', 'C-c'], (ch, key) => process.exit(0))

screen.render()
