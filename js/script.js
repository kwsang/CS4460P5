var width = 940;
var height = 600;
var regionWidth = 600;
var regionHeight = 400;

var selectedState = "";

var admissionsButton = d3.select('#access-row')
    .append('g')
    .append('button')
    .attr('id', 'admissions-btn')
    .text('Admissions');
var populationButton = d3.select('#access-row')
    .append('g')
    .append('button')
    .attr('id', 'population-btn')
    .text('Population');
var financeButton = d3.select('#access-row')
    .append('g')
    .append('button')
    .attr('id', 'finance-btn')
    .text('Finance');
var debtButton = d3.select('#access-row')
    .append('g')
    .append('button')
    .attr('id', 'debt-btn')
    .text('Debt');
var employmentButton = d3.select('#access-row')
    .append('g')
    .append('button')
    .attr('id', 'employment-btn')
    .text('Employment');
var selectedButton = "";

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
            flightPhase: d['Broad Phase of Flight']
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
    var lastIndex = -1;
    var activeIndex = 0;

    var mapSVG = d3.select('#vis')
        .append('svg')
        .classed('map', true)
        .attr('width', width)
        .attr('height', height);

    var projection = d3.geoAlbersUsaPr(),
        path = d3.geoPath().projection(projection);
    var stateJson = topojson.feature(states, states.objects.states_20m_2017);
    // save states data onto d3 map features
    for (var i = 0; i < stateJson.features.length; i++) {
        var state = stateJson.features[i];
        for (var j = 0; j < stateCSV.length; j++) {
            if (state.properties.GEOID == stateCSV[j].ansi) {
                state.name = stateCSV[j].name;
                break;
            }
        }
    }

    var locked = false;

    // state coloring method
    function recolorMap(selectedState) {
        mapSVG.selectAll('path')
            .data(stateJson.features)
            .classed('selected', false);
        if (error) throw error;
        mapSVG.selectAll('path')
            .data(stateJson.features)
            .filter(function (d) {
                return d.name == selectedState;
            })
            .classed('selected', true);
    };

    // draw state path features
    var paths_states = mapSVG
        .append('g').selectAll('path')
        .data(stateJson.features)
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
        .on('mousemove', function (d) {
            var mouse = d3.mouse(mapSVG.node()).map(function (d) {
                return parseInt(d);
            });
            hoverTooltip.classed('hidden', false)
                .attr('style', 'left:' + (mouse[0] + 15) +
                    'px; top:' + (mouse[1] - 35) + 'px')
                .html(d.name + "<br />");
            generateTooltip(d.name);
        })
        .on('mouseout', function () {
            hoverTooltip.classed('hidden', true);
            if (!locked) {
                recolorMap("");
            }
        });

    admissionsButton.on('click', function () {
        selectedButton = "admissions";
        admissionsButton.classed('selected', true);
    });

    function generateTooltip(state) {
        collegeCSV.filter(function (d) {
            return d.name == selectedState;
        })
        d3.select('#tooltip')
            .append('g')

    }

    scroll.on('active', function (index) {
        // highlight current step text
        d3.selectAll('.step')
            .style('opacity', function (d, i) { return i === index ? 1 : 0.1; });
    });

    scroll.on('progress', function (index, progress) {
    });
}



