// Map Implementation using Leaflet.js and OpenStreetMap
// Author: TravelOn Team

document.addEventListener('DOMContentLoaded', () => {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    // Default coordinates (Center of India)
    const defaultLat = 20.5937;
    const defaultLng = 78.9629;
    const defaultZoom = 5;

    // Initialize Map
    const map = L.map('map').setView([defaultLat, defaultLng], defaultZoom);

    // Add Tile Layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Custom Red Icon (using FontAwesome to avoid broken images)
    const redIcon = L.divIcon({
        className: 'custom-div-icon',
        html: "<div style='background-color:#FF385C; width: 30px; height: 30px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3);'><i class='fas fa-home' style='color: white; font-size: 14px;'></i></div>",
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -20]
    });

    // Geocode Logic (Nominatim API)
    if (typeof listingLocation !== 'undefined' && listingLocation) {
        const query = `${listingLocation}, ${typeof listingCountry !== 'undefined' ? listingCountry : ''}`;
        console.log("Geocoding query:", query);

        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(data => {
                if (data && data.length > 0) {
                    const lat = parseFloat(data[0].lat);
                    const lon = parseFloat(data[0].lon);

                    // Update Map View
                    map.setView([lat, lon], 13);

                    // Add Marker
                    L.marker([lat, lon], { icon: redIcon })
                        .addTo(map)
                        .bindPopup(`<b>${listingLocation}</b><br>Exact location provided after booking.`)
                        .openPopup();

                    // Add Privacy Circle (Approximate Area)
                    L.circle([lat, lon], {
                        color: '#FF385C',
                        fillColor: '#FF385C',
                        fillOpacity: 0.2,
                        radius: 500
                    }).addTo(map);

                    // ===== WEATHER FETCH =====
                    fetchWeather(lat, lon);
                } else {
                    console.log("Location not found");
                    updateWeatherWidget(null); // Handle no location
                }
            })
            .catch(error => {
                console.error("Geocoding error:", error);
                updateWeatherWidget(null);
            });
    }

    // Weather Logic (Open-Meteo API)
    function fetchWeather(lat, lon) {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
        fetch(weatherUrl)
            .then(res => res.json())
            .then(data => {
                if (data && data.current_weather) {
                    updateWeatherWidget(data.current_weather);
                } else {
                    updateWeatherWidget(null);
                }
            })
            .catch(err => {
                console.error("Weather fetch error:", err);
                updateWeatherWidget(null);
            });
    }

    // Update Weather Widget DOM
    function updateWeatherWidget(weather) {
        const widget = document.getElementById('weather-widget');
        if (!widget) return;

        if (weather) {
            const temp = weather.temperature;
            const code = weather.weathercode;
            const icon = getWeatherIcon(code);
            widget.innerHTML = `
                <span class="weather-icon">${icon}</span>
                <span class="weather-temp">${temp}°C</span>
                <span class="weather-location">${listingLocation || ''}</span>
            `;
        } else {
            widget.innerHTML = `<span class="weather-error">Weather unavailable</span>`;
        }
    }

    // Weather Code to Emoji Mapping
    function getWeatherIcon(code) {
        const icons = {
            0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
            45: '🌫️', 48: '🌫️',
            51: '🌦️', 53: '🌧️', 55: '🌧️',
            61: '🌧️', 63: '🌧️', 65: '🌧️',
            71: '🌨️', 73: '🌨️', 75: '🌨️',
            80: '🌧️', 81: '🌧️', 82: '🌧️',
            95: '⛈️', 96: '⛈️', 99: '⛈️'
        };
        return icons[code] || '🌡️';
    }
});
