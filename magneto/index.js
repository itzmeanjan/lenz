const blessed = require('blessed')
const contrib = require('blessed-contrib')

const screen = blessed.screen()
const map = contrib.map({ label: 'World Map' })

screen.append(map)
map.addMarker({ "lon": "-79.0000", "lat": "37.5000", color: "red", char: "*" })

screen.key(['escape', 'q', 'C-c'], function (ch, key) {
    return process.exit(0);
});

screen.render()
