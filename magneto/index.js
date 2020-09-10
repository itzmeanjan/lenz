const DHT = require('bittorrent-dht')
const magnetParser = require('magnet-uri')

const map = L.map('map', {
    zoomControl: false,
    minZoom: 2,
    inertia: true,
    keyboard: false,
    maxBounds: [[90, -180], [-90, 180]]
}).setView([0, 0], 2)

map.whenReady(_ => {
    const uri = 'magnet:?xt=urn:btih:e3811b9539cacff680e418124272177c47477157'
    const parsed = magnetParser(uri)

    console.log(parsed.infoHash)
})

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }
).addTo(map)
