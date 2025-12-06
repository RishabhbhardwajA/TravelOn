
let coordinates = listing.geometry.coordinates;

var map = L.map('map').setView([coordinates[1], coordinates[0]], 13);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

var customIcon = L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/3203/3203002.png", 
    iconSize: [50, 50], 
    iconAnchor: [25, 50], 
    popupAnchor: [0, -50]
});


var marker = L.marker([coordinates[1], coordinates[0]], { icon: customIcon })
    .addTo(map);


marker.bindPopup(`<b>${listing.title}</b><br>Exact location provided `)
      .openPopup();