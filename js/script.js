var width = 940;
var height = 600;
var regionWidth = 600;
var regionHeight = 400;
var circleStyle = { radius: 4, opacity: 1, pointer: "all", color: "black", type: 'dot', scale: 'uniform' };
var circleHoverStyle = { radius: 4, opacity: 1, pointer: "all", color: "black" };

var selectedState = "";
var selectedDatum = "";
var lastIndex = -1;
var activeIndex = 0;
var activateFunctions = [];
var updateFunctions = []
for (var i = 0; i < 9; i++) {
    activateFunctions[i] = function () { };
    updateFunctions[i] = function () { };
}

var mapSVG = d3.select('#vis')
    .append('svg')
    .classed('map', true)
    .attr('width', width)
    .attr('height', height);

var optionsSVG = d3.select('#options')
    .append('svg')
    .attr('width', width);

// hidden hoverTooltip
var hoverTooltip = d3.select('#vis').append('div')
    .attr('id', 'tooltip')
    .attr('class', 'hidden tooltip');

//i have no idea what the purpose of this rectangle is
/*var timeBar = optionsSVG.append('rect')
    .attr('x', 5)
    .attr('y', 50)
    .attr('width', width)
    .attr('height', 10);*/

var xScale = d3.scaleTime().range([0, width]);
var heatScale = d3.scaleLinear().domain([0, 12.5]).range([0, 300]);
d3.select('#gradient').append('g')
    .attr("transform", "translate(0,5)").call(d3.axisBottom(heatScale).tickSizeOuter(0));
var timeAxis = d3.axisBottom(xScale);

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
        var mapCoords = { lat: 0, long: 0 };
        if (d['Latitude'] == '' && d['Longitude'] == '' && d['Country'] == 'United States' && d['Location'] != '') {
            mapCoords.lat = +cityCoords[d['Location'].toLowerCase()].lat;
            mapCoords.long = +cityCoords[d['Location'].toLowerCase()].long;
        } else {
            mapCoords.lat = +d['Latitude'];
            mapCoords.long = +d['Longitude'];
        }
        return {
            number: d['Accident_Number'],
            dateS: d['Event_Date'],
            date: new Date(d['Event_Date']),
            location: d['Location'],
            country: d['Country'],
            latitude: mapCoords.lat,
            longitude: mapCoords.long,
            airportCode: d['Airport_Code'],
            airportName: d['Airport_Name'],
            severity: d['Injury_Severity'],
            damage: d['Aircraft_Damage'],
            registration: d['Registration_Number'],
            make: d['Make'],
            model: d['Model'],
            schedule: d['Schedule'],
            carrier: d['Air_Carrier'],
            fatalities: +d['Total_Fatal_Injuries'],
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

    activateFunctions[0] = shrinkHeatMaps;
    activateFunctions[1] = drawHeatMaps;
    activateFunctions[2] = drawColorCircles;
    activateFunctions[3] = drawHeatFatalities;


    function drawHeatMaps() {
        circleStyle.opacity = 0.05;
        circleStyle.radius = 12;
        circleStyle.pointer = 'none';
        circleStyle.color = 'black';
        circleStyle.type = 'dot';
        circleStyle.scale = 'uniform';
        drawCircles();
    }

    function shrinkHeatMaps() {
        circleStyle.opacity = 1;
        circleStyle.radius = 4;
        circleStyle.color = 'black';
        circleStyle.pointer = 'all';
        circleStyle.type = 'dot';
        circleStyle.scale = 'uniform';
        drawCircles();
    }

    function drawColorCircles() {
        circleStyle.opacity = 0.08;
        circleStyle.radius = 12;
        circleStyle.pointer = 'none';
        circleStyle.type = 'heat';
        circleStyle.scale = 'uniform';
        drawCircles();
    }


    function drawHeatFatalities() {
        circleStyle.opacity = 1;
        circleStyle.pointer = 'all';
        circleStyle.type = 'heat';
        circleStyle.scale = 'linear';
        drawCircles();
    }

    var circles = mapSVG
        .append('g')
        .selectAll('circle')
        .data(selection)
        .enter()
        .append('circle')
    drawCircles();

    function showTooltip(d) {
        var mouse = d3.mouse(mapSVG.node()).map(function (d) {
            return parseInt(d);
        });
        hoverTooltip.classed('hidden', false)
            .attr('style', 'left:' + (mouse[0] + 15) +
                'px; top:' + (mouse[1] - 35) + 'px')
            .html(d.make + ' ' + d.model + ' ' + '<br />' + d.location + '<br />' + d.dateS + '<br />' + d.severity);

    }
    
    xScale.domain(d3.extent(selection, function (d) {
        return d.date;
    }));

    //timeAxis formatting
    timeAxis.tickSizeOuter(30);
    timeAxis.tickSizeInner(35);
    timeAxis.tickPadding(5);

    optionsSVG.append('g')
        .attr('class', 'x-axis')
        .call(timeAxis);

    optionsSVG.append("text")
        .attr("transform", "translate(" + (width / 2) + " ," + 90 + ")")
        .style("text-anchor", "middle")
        .text("Date");

    var brush = d3.brushX(xScale)
        .extent([[0, 0], [width, 30]]);

    optionsSVG.append('g')
        .attr('class', 'brush')
        .call(brush);

    brush
        .on('brush', brushed)
        .on('end', brushend);

    function brushed() {
        var time = d3.event.selection;
        var circles = mapSVG.selectAll('circle').data(selection.filter(function (d) {
            return d.date >= xScale.invert(time[0]) && d.date <= xScale.invert(time[1]);
        }));
        circles.exit().remove();
        circles.enter().append('circle')
            .attr('r', '0');
        drawCircles();
    }

    //this is not currently working for some reason. i don't understand ;-;
    function brushend() {
        var time = d3.event.selection;
        if (time == null) {
            time = [0,0];
        }
        var circles = mapSVG.selectAll('circle').data(selection.filter(function (d) {
            return d.date >= xScale.invert(0);
        }));
        var length = time[1] - time[0];
        if (length < 5) {
            circles.enter().append('circle')
                .attr('r', '0');
            drawCircles();
            //d3.select(".brush").call(brush.remove());
        }
        console.log(d3.event.selection);
        console.log(length);
    }

    function drawCircles() {
        mapSVG.selectAll('circle')
            .on('click', selectCircle)
            .on('mouseover', showTooltip)
            .on('mouseout', function (d) {
                hoverTooltip.classed('hidden', true);
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
            .attr('pointer-events', circleStyle.pointer)
            .transition()
            .duration(1000)
            .style('fill', colorBySeverity)
            .style('opacity', circleStyle.opacity)
            .attr('r', radiusBySeverity);
    }

    function colorBySeverity(d) {
        if (circleStyle.type == 'heat') {
            if (d.severity.match(/Fatal\(/)) {
                return 'red';
            } else if (d.severity.match(/Non-Fatal/)) {
                return 'blue';
            } else if (d.severity.match(/Incident/)) {
                return 'green';
            }
        }
        return 'black';
    }

    function radiusBySeverity(d) {
        if (circleStyle.scale == 'linear') {
            var sizeScale = d3.scaleLinear().domain([1, 120]).range([2, 10]);
            return sizeScale(d.fatalities);
        }
        return circleStyle.radius;
    }

    function selectCircle(d) {
        if (selectedDatum != d.number) {
            selectedDatum = d.number;
            d3.selectAll('circle').filter(function (d) {
                return d.number == selectedDatum;
            })
                .transition()
                .duration(750)
                .style('border-color', 'white')
                .attr('r', +this['attributes']['r'].value + 2);
            d3.select('#number').text(d.number);
            d3.select('#makeModel').text(d.make + ' ' + d.model);
            d3.select('#date').text(d.dateS);
            d3.select('#severity').text(d.severity);
            d3.select('#injuries').text(d.fatalities + ' fatalities, ' + d.injuries + ' injuries, ' + d.uninjured + ' uninjured');
            d3.select('#city').text(d.location);
            d3.select('#carrier').text(d.carrier);
            d3.select('#airport').text('[' + d.airportCode + '] ' + d.airportName);
            d3.select('#weather').text(d.weather);
        }
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



