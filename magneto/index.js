const map = L.map('map', {
    zoomControl: false,
    minZoom: 2,
    inertia: true,
    keyboard: false,
    maxBounds: [[90, -180], [-90, 180]]
}).setView([0, 0], 2)

map.whenReady( _ => { console.log('ready') })

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }
).addTo(map)
