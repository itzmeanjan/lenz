document.addEventListener('DOMContentLoaded', _ => {
    const map = L.map('map').setView([51.505, -0.09], 1)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
})
