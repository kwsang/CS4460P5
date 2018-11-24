var width = 940;
var height = 600;
var regionWidth = 600;
var regionHeight = 400;

var selectedState = "";
var lastIndex = -1;
var activeIndex = 0;
var activateFunctions = [];
var updateFunctions = []
for (var i = 0; i < 9; i++) {
    activateFunctions[i] = function () { };
    updateFunctions[i] = function () { };
}

// hidden hoverTooltip
var hoverTooltip = d3.select('#vis').append('div')
    .attr('id', 'tooltip')
    .attr('class', 'hidden tooltip');

var timeBar = d3.select('#options')
    .append('svg')
    .attr('width', width)
    .append('rect')
    .attr('x', 5)
    .attr('x', 5)
    .attr('width', width)
    .attr('height', 10);

var x = d3.scaleTime().range([0, width]);


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
            number: d['Accident_Number'],
            date: new Date(d['Event_Date']),
            location: d['Location'],
            country: d['Country'],
            latitude: +d['Latitude'],
            longitude: +d['Longitude'],
            airportCode: d['Airport_Code'],
            airportName: d['Airport_Name'],
            severity: d['Injury_Severity'],
            damage: d['Aircraft_Damage'],
            registration: d['Registration_Number'],
            make: d['Make'],
            model: d['Model'],
            schedule: d['Schedule'],
            carrier: d['Air_Carrier'],
            fatalies: +d['Total_Fatal_Injuries'],
            injuries: +d['Total_Serious_Injuries'],
            uninjured: +d['Total_Uninjured'],
            weather: d['Weather_Condition'],
            flightPhase: d['Broad_Phase_of_Flight'],
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

    var brush = d3.brushX()
        .extent([d3.min(selection, function (d) { return d.date; }), d3.max(selection, function (d) { return d.date; })])
        .on('brush end', brushed);

    function brushed() {

    }

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

    activateFunctions[0] = shrinkHeatMaps;
    activateFunctions[1] = drawHeatMaps;

    function drawHeatMaps() {
        mapSVG.selectAll('circle')
            .data(selection)
            .transition()
            .duration(1000)
            .style('opacity', 0.075)
            .attr('r', 12)
            .attr('pointer-events', 'none');
    }

    function shrinkHeatMaps() {
        mapSVG.selectAll('circle')
            .data(selection)
            .transition()
            .duration(1000)
            .style('opacity', 1)
            .attr('r', 4)
            .attr('pointer-events', 'all');
    }


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
        .on('mouseover', showTooltip)
        .on('mouseout', hideTooltip)
        .attr('r', '0.5')
        .transition()
        .duration(750)
        .attr('r', '4');



    function showTooltip(d) {
        var mouse = d3.mouse(mapSVG.node()).map(function (d) {
            return parseInt(d);
        });
        hoverTooltip.classed('hidden', false)
            .attr('style', 'left:' + (mouse[0] + 15) +
                'px; top:' + (mouse[1] - 35) + 'px')
            .html(d.make + ' ' + d.model + ' ' + "<br />" + d.date + '<br />' + d.severity);

    }

    function hideTooltip(d) {
        hoverTooltip.classed('hidden', true);
    }

    scroll.on('active', function (index) {
        // highlight current step text
        d3.selectAll('.step')
            .style('opacity', function (d, i) { return i === index ? 1 : 0.1; });
        activeIndex = index;
        var sign = (activeIndex - lastIndex) < 0 ? -1 : 1;
        var scrolledSections = d3.range(lastIndex + sign, activeIndex + sign, sign);
        scrolledSections.forEach(function (i) {
            activateFunctions[i]();
        });
        lastIndex = activeIndex;
    });

    scroll.on('progress', function (index, progress) {
        updateFunctions[index](progress);
    });
}



