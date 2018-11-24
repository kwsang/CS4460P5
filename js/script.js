var width = 940;
var height = 600;
var regionWidth = 600;
var regionHeight = 400;

var selectedState = "";

// hidden hoverTooltip
var hoverTooltip = d3.select('#vis').append('div')
    .attr('id', 'tooltip')
    .attr('class', 'hidden tooltip');

// method to create leading zeroes
Number.prototype.pad = function (size) {
    var s = String(this);
    while (s.length < (size || 2)) { s = "0" + s; }
    return s;
}

var scroll = scroller().container(d3.select('#sections'));
scroll(d3.selectAll('.step'));

d3.queue()
    .defer(d3.csv, 'csv/aircraft_incidents.csv', function (d) {
        return {
            number: d['Accident Number'],
            date: d['Event Date'],
            location: d['Location'],
            country: d['Country'],
            latitude: +d['Latitude'],
            longitude: +d['Longitude'],
            airportCode: d['Airport Code'],
            airportName: d['Airport Name'],
            severity: d['Injury Severity'],
            damage: d['Aircraft Damage'],
            registration: d['Registration Number'],
            make: d['Make'],
            model: d['Model'],
            schedule: d['Schedule'],
            carrier: d['Air Carrier'],
            fatalies: +d['Total Fatal Injuries'],
            injuries: +d['Total Serious Injuries'],
            uninjured: +d['Total Uninjured'],
            weather: d['Weather Condition'],
            flightPhase: d['Broad Phase of Flight'],
            name: d['Location']
        };
    })
    .defer(d3.csv, 'csv/states.csv', function (d) {
        return {
            ansi: (+d.STATE).pad(2),
            stusab: d.STUSAB,
            name: d.STATE_NAME,
            statens: d.STATENS
        };
    })
    .await(display);

function display(error, collegeCSV, stateCSV) {
    if (error) {
        console.log('Error importing data ' + error);
    }

    var mapSVG = d3.select('#vis')
        .append('svg')
        .classed('map', true)
        .attr('width', width)
        .attr('height', height);

    // draw map vis
    var projection = d3.geoAlbersUsa().scale(1000).translate([width / 2, height / 2]);

    var path = d3.geoPath().projection(projection);
    var stateFeatures = topojson.feature(states, states.objects.states_20m_2017).features;
    // save states data onto d3 map features
    for (var i = 0; i < stateFeatures.length; i++) {
        var state = stateFeatures[i];
        for (var j = 0; j < stateCSV.length; j++) {
            if (state.properties.GEOID == stateCSV[j].ansi) {
                state.name = stateCSV[j].name;
                break;
            }
        }
    }
    // filter US flights
    var selection = collegeCSV.filter(function (d) {
        return (d.country == "United States" && projection([d.longitude, d.latitude]));
    });

    var locked = false;

    // state coloring method
    function recolorMap(selectedState) {
        mapSVG.selectAll('path')
            .data(stateFeatures)
            .classed('selected', false);
        if (error) throw error;
        mapSVG.selectAll('path')
            .data(stateFeatures)
            .filter(function (d) {
                return d.name == selectedState;
            })
            .classed('selected', true);
    };

    // draw state path features
    var paths_states = mapSVG
        .append('g').selectAll('path')
        .data(stateFeatures)
        .enter().append('path')
        .attr('d', path)
        .classed('selected', function (d) {
            if (d.properties.filled) {
                return true;
            } else {
                return false;
            }
        })
        .on('mouseover', function (d) {
            if (!locked) {
                recolorMap(d.name);
            }
        })
        .on('click', function (d) {
            if (locked == false) {
                recolorMap(d.name);
                locked = d.name;
            } else if (locked == d.name) {
                recolorMap("");
                locked = false;
            }
        })
        .on('mouseout', function (d) {
            if (!locked) {
                recolorMap("");
            }
        });


    var circles = mapSVG
        .append('g')
        .selectAll('circle')
        .data(selection)
        .enter()
        .append('circle')
        .attr('class', 'incident')
        .attr('text', function (d) {
            return d.location;
        })
        .attr('cx', function (d) {
            var pos = projection([d.longitude, d.latitude]);
            if (pos == null) {
                console.log(d);
            }
            return pos[0];
        })
        .attr('cy', function (d) {
            var pos = projection([d.longitude, d.latitude]);
            if (pos == null) {
                console.log(d);
            }
            return pos[1];
        })
        .attr('r', '3.5')
        .on('mouseover', showTooltip)
        .on('mouseout', hideTooltip);


    function showTooltip(d) {
        var mouse = d3.mouse(mapSVG.node()).map(function (d) {
            return parseInt(d);
        });
        hoverTooltip.classed('hidden', false)
            .attr('style', 'left:' + (mouse[0] + 15) +
                'px; top:' + (mouse[1] - 35) + 'px')
            .html(d.name + "<br />");
    }

    function hideTooltip(d) {
        hoverTooltip.classed('hidden', true);
    }

    scroll.on('active', function (index) {
        // highlight current step text
        d3.selectAll('.step')
            .style('opacity', function (d, i) { return i === index ? 1 : 0.1; });
    });

    scroll.on('progress', function (index, progress) {
    });
}



