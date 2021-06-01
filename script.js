// Edit the center point and zoom level
var map = L.map('map', {
  center: [41.65760690204154, -72.65877371569808], // rough midpoint of CT
  zoom: 12,
  scrollWheelZoom: false
});

// set bounds for geocoder: min = southwest corner, max = northeast corner of CT
var minLatLng = [40.91671052319694, -73.7848723225657];
var maxLatLng = [42.068748311320974, -71.75240165927671];
var bounds = L.latLngBounds(minLatLng, maxLatLng);

var choroplethLayer;
var choroplethOpacity = 0.7;

// toggle baselayers; global variable with (null, null) allows indiv layers to be added inside functions below
// var controlLayers = L.control.layers( null, null, {
//   position: "topright",
//   collapsed: true
// }).addTo(map);

//baselayer
var presentStreets = new L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
	subdomains: 'abcd',
	maxZoom: 19
}).addTo(map); // adds layer by default
// controlLayers.addBaseLayer(presentStreets, 'Present Streets');

var searchControl = L.esri.Geocoding.geosearch({
  placeholder: "Search Connecticut...",
  searchBounds: bounds
}).addTo(map);

// Prepend attribution to "Powered by Esri"
map.attributionControl.setPrefix('View\
  <a href="https://github.com/ontheline/otl-planning-zoning-ct" target="_blank">sources and code on GitHub</a>,\
  created with ' + map.attributionControl.options.prefix);

 var results = L.layerGroup().addTo(map);

 searchControl.on('results', function (data) {
   results.clearLayers();
   for (var i = data.results.length - 1; i >= 0; i--) {
     results.addLayer(L.marker(data.results[i].latlng));
   }
 });

L.control.scale().addTo(map);

// customized version of https://colorbrewer2.org/#type=sequential&scheme=BuPu&n=4
var choroplethStyle = function(f) {
  var text2color = {
    'Planning and Zoning': '#88419d', // dark purple
    'Zoning': '#5463ab', // medium (custom)
    'Planning': '#b3cde3', // light
    'none': '#ffffff', // white
  }

  return {
    'color': 'black',
    'weight': 1,
    'fillColor': text2color[ f.properties.agency ] || 'gray', // gray if no data
    'fillOpacity': choroplethOpacity
  }
}

// display polygons with fillColor and labels on hover
$.getJSON("ct-towns-pz-1957.geojson", function (data) {
  choroplethLayer = L.geoJson(data, {
    style: choroplethStyle,
    // Add tooltips
    onEachFeature: function(feature, layer) {
      var text = '<b>' + feature.properties.name
        + '</b><br>' + feature.properties.agency;

      layer.bindTooltip(text, { sticky: true });
    }
  }).addTo(map);

  map.fitBounds(choroplethLayer.getBounds());
});

// places a star on state capital of Hartford, CT
var starIcon = L.icon({
  iconUrl: 'star-18.png',
  iconRetinaUrl: 'star-18@2x.png',
  iconSize: [18, 18]
});
L.marker([41.7646, -72.6823], {icon: starIcon}).addTo(map);


// Add Opacity control
var opacity = L.control({position: 'topright'});
opacity.onAdd = function (map) {
  var div = L.DomUtil.create('div', 'control-custom range');
  div.innerHTML = '<h4>Opacity: Towns</h4>';
  div.innerHTML += '<input id="rangeSlider" type="range" min="0" max="100" value="90">';

  // Make sure the map doesn't move with slider change
  L.DomEvent.disableClickPropagation(div);
  return div;
};
opacity.addTo(map);

$('#rangeSlider').on('input', function() {
  choroplethOpacity = $(this).val() / 100;

  if (choroplethLayer) {
    choroplethLayer.setStyle(choroplethStyle);
  }
})


// add custom legend https://www.figma.com/file/7JitgyYxiT3xR3fyoZttKb/otl-zoning-graphics
var legend = L.control({position: 'bottomright'});

legend.onAdd = function(map) {
  var div = L.DomUtil.create('div', 'info legend');
  div.innerHTML += '<img src="./1957-agencies-legend.png" alt="1957 Agencies Legend" width="150">';
  return div;
};

legend.addTo(map);
