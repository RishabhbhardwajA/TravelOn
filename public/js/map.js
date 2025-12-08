
// Check if listing and geometry exist
if (!listing || !listing.geometry || !listing.geometry.coordinates) {
    console.error("Map Error: No geometry data available");
    document.getElementById('map').innerHTML = '<p style="padding: 2rem; text-align: center; color: #666;">Map location not available for this listing</p>';
} else {
    let coordinates = listing.geometry.coordinates;

    // Validate coordinates
    let lat = coordinates[1] || 20.5937;  // Default to India center
    let lon = coordinates[0] || 78.9629;

    var map = L.map('map').setView([lat, lon], 13);

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

    var marker = L.marker([lat, lon], { icon: customIcon })
        .addTo(map);

    marker.bindPopup(`<b>${listing.title}</b><br>Exact location provided`)
        .openPopup();
}