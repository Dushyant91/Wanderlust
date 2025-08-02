// maptilersdk.config.apiKey = maptilerKey;
// const map = new maptilersdk.Map({
//     container: 'map', // container id
//     style: maptilersdk.MapStyle.STREETS,
//     center: [ listing.geometry.coordinates[0], listing.geometry.coordinates[1]],// starting position [lng, lat]
//     zoom: 10 // starting zoom
// });

maptilersdk.config.apiKey = maptilerKey;

const mapDiv = document.getElementById("map");
const lng = parseFloat(mapDiv.dataset.lng);
const lat = parseFloat(mapDiv.dataset.lat);

const map = new maptilersdk.Map({
    container: 'map',
    style: maptilersdk.MapStyle.STREETS,
    center: [lng, lat],
    zoom: 10
});

new maptilersdk.Marker().setLngLat([lng, lat]).addTo(map);
