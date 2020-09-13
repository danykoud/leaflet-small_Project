// Store our API endpoint inside queryUrl
var link = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/1.0_month.geojson";

// Perform a GET request to the query URL
d3.json(link).then( function(data) {

  FeatureCollection(data.features);
  console.log(data)
});

function FeatureCollection(earthquakeData) {

  // Define a function we want to run once for each feature in the features array
  // Give each feature a popup describing the place and time of the earthquake
  function onEachFeature(feature, layer) {
    layer.bindPopup("<h3>" + feature.properties.place +
      "</h3><hr><p>" + new Date(feature.properties.time) + "</p><hr><p>"+ "Magnitude:" + feature.properties.mag + "</p><hr><p>"+ "Significance: " + feature.properties.sig +"</p>");
  }

  // Define function to create the circle radius based on the magnitude
  function radiuslength(magnitude) {
    return magnitude * 20000;
  }

  /// Function that will determine the color of a neighborhood based on the borough it belongs to
function  circleColor(magnitude) {
  switch (true) {
  case magnitude < 1:
    return "#ccff33";
  case magnitude < 2:
    return "#ffff33";
  case magnitude < 3:
    return "#ffcc33";
  case magnitude < 4:
    return "#ff9933";
  case magnitude < 5:
    return "#ff6633";
  default:
    return "#ff3333";
  }
}

  // Create a GeoJSON layer containing the features array on the earthquakeData object
  // Run the onEachFeature function once for each piece of data in the array
  var earthquakes = L.geoJSON(earthquakeData, {
    pointToLayer: function(earthquakeData, latlng) {
      return L.circle(latlng, {
        radius: radiuslength(earthquakeData.properties.mag),
        color: circleColor(earthquakeData.properties.mag),
        fillOpacity: .5
      });
    },
    onEachFeature: onEachFeature
  });

  // Sending our earthquakes layer to the createMap function
  createMap(earthquakes);
}

function createMap(earthquakes) {

  // Adding tile layer
const streetmap = L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
  attribution: "© <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> <strong><a href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a></strong>",
  tileSize: 512,
  maxZoom: 18,
  zoomOffset: -1,
  id: "mapbox/streets-v11",
  accessToken: API_KEY
})

const darkmap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
  attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
  maxZoom: 18,
  id: "dark-v10",
  accessToken: API_KEY
})
  // Create the faultline layer
  var faultLine = new L.LayerGroup();
  
  // Define a baseMaps object 
  const baseMaps = {
    "Street Map": streetmap,
    "Dark Map": darkmap
  };

  // Create overlay object
  var overlayMaps = {
    Earthquakes: earthquakes,
    Fault: faultLine
  };

  // Create our map
  var myMap = L.map("map", {
    center: [
      37.09, -95.71
    ],
    zoom: 4,
    layers: [ streetmap , earthquakes, faultLine]
  });

  // Create a layer control
  // Pass in our baseMaps and overlayMaps
  // Add the layer control to the map
  L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
  }).addTo(myMap);

  // Query to retrieve the faultline data
  var Fault= "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_plates.json";
  
  // Create the faultlines and add them to the faultline layer
  d3.json(Fault, function(data) {
    L.geoJSON(data, {
      style: function() {
        return {color: "orange", fillOpacity: 0}
      }
    }).addTo(Fault)
  })

  // color function to be used when creating the legend
  function Colorlegend(d) {
    return d > 1000 ? '#ff3333' :
           d > 750  ? '#ff9933' :
           d > 500  ? '#ffcc33' :
           d > 250  ? '#ffff33' :
                    '#ccff33';
  }

  // Add legend to the map
  var legend = L.control({position: 'bottomright'});
  
  legend.onAdd = function (map) {
  
      var div = L.DomUtil.create('div', 'info legend'),
          sig = [0, 250, 500, 750, 1000],
          labels = [];
  
      // loop through our density intervals and generate a label with a colored square for each interval
      for (var i = 0; i < sig.length; i++) {
          div.innerHTML +=
              '<i style="background:' + Colorlegend(sig[i] + 1) + '"></i> ' +
              sig[i] + (sig[i + 1] ? '&ndash;' + sig[i + 1] + '<br>' : '+');
      }
  
      return div;
  };
  
  legend.addTo(myMap);
}