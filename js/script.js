var width = 960;
var height = 600;
var regionWidth = 600;
var regionHeight = 400;

var regionNames = ['FarWest', 'GreatLakes', 'GreatPlains', 'MidAtlantic', 'NewEngland',
    'OutlyingAreas', 'RockyMountains', 'Southeast', 'Southwest'];
var path = d3.geoPath();
var mapSVG = d3.select('#vis')
    .append('svg')
    .classed('map', true)
    .attr('width', width)
    .attr('height', height);

// create region selector
var regionSelect = d3.select('#sections')
    .append('g')
    .append('select')
    .attr('id', 'regionSelect');
regionNames.forEach(function (region, idx, arr) {
    regionSelect.append('option').text(region);
});
// hidden hoverTooltip
var hoverTooltip = d3.select('body').append('div')
    .attr('class', 'hidden tooltip');
// method to create leading zeroes
Number.prototype.pad = function (size) {
    var s = String(this);
    while (s.length < (size || 2)) { s = "0" + s; }
    return s;
}

// get vertical coordinates of starting position
sectionPositions = [];
var startPos;
d3.selectAll('section').each(function (d, i) {
    var top = this.getBoundingClientRect().top;
    if (i === 0) {
        startPos = top;
    }
    sectionPositions.push(top - startPos);
});

d3.csv('csv/colleges.csv', function (d) {
    return {
        // parse project data
        control: d.control,
        region: d.region,
        locale: d.locale,
        admissionRate: +d['Admission Rate'],
        actMdn: +d['ACT Median'],
        satAvg: +d['SAT Average'],
        population: +d['Undergrad Population'],
        whitePop: +d['% White'],
        blackPop: +d['% Black'],
        HispanicPop: +d['% Hispanic'],
        indianPop: +d['% American Indian'],
        pacificPop: +d['% Pacific Islander'],
        biracialPop: +d['% Biracial'],
        nrAlienPop: +d['% Nonresident Aliens'],
        partTimers: +d['% Part-time Undergrads'],
        avgCost: +d['Average Cost'],
        studentCosts: +d['Expenditure Per Student'],
        avgSalary: +d['Average Faculty Salary'],
        faculty: +d['% Full-time Faculty'],
        pellGrant: +d['% Undergrads with Pell Grant'],
        completionRate: +d['Completion Rate 150% time'],
        retentionRate: +d['Retention Rate (First Time Students)'],
        olderUndergrads: +d['% Undergrads 25+ y.o.'],
        defaultRate: +d['3 Year Default Rate'],
        medianDebt: +d['Median Debt'],
        medianGradDebt: +d['Median Debt on Graduation'],
        medianWithdrawDebt: +d['Median Debt on Withdrawal'],
        federalLoans: +d['% Federal Loans'],
        pellGrants: +d['% Pell Grant Recipients'],
        avgEntryAge: +d['Average Age of Entry'],
        avgFamilyIncome: +d['Average Family Income'],
        mdnFamilyIncome: +d['Median Family Income'],
        povertyRate: +d['Poverty Rate'],
        unemployedRate: +d['Number of Unemployed 8 years after entry'],
        employedRate: +d['Number of Employed 8 years after entry'],
        avgEarnings: +d['Mean Earnings 8 years After Entry'],
        mdnEarnings: +d['Median Earnings 8 years After Entry']
    };
    // main d3 function
}, function (error, csv) {
    if (error) throw error;
    d3.csv('csv/states.csv', function (d) {
        // parse states data, necessary to define regions
        return {
            ansi: (+d.STATE).pad(2),
            stusab: d.STUSAB,
            name: d.STATE_NAME,
            statens: d.STATENS,
            region: d.region
        };
        // states function
    }, function (error, stateCSV) {
        var projection = d3.geoAlbersUsaPr(),
            path = d3.geoPath().projection(projection);
        var stateJson = topojson.feature(states, states.objects.states_20m_2017);
        // save states data onto d3 map features
        for (var i = 0; i < stateJson.features.length; i++) {
            var state = stateJson.features[i];
            for (var j = 0; j < stateCSV.length; j++) {
                if (state.properties.GEOID == stateCSV[j].ansi) {
                    state.name = stateCSV[j].name;
                    state.region = stateCSV[j].region;
                    break;
                }
            }
        }

        var locked = false;
        // enable dropdown selector function
        d3.select('#regionSelect')
            .on('click', function (d) {
                var regionSelect = document.getElementById('regionSelect');
                var selectedRegion = regionSelect.options[regionSelect.selectedIndex].value;
                locked = selectedRegion;
                recolorMap(selectedRegion);
            });
        // region coloring method
        function recolorMap(selectedRegion) {
            mapSVG.selectAll('path')
                .data(stateJson.features)
                .classed('selected', false);
            if (error) throw error;
            mapSVG.selectAll('path')
                .data(stateJson.features)
                .filter(function (d) {
                    return d.region == selectedRegion;
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
                    recolorMap(d.region);
                    updateVis(d.region);
                }
            })
            .on('click', function (d) {
                if (locked == false) {
                    recolorMap(d.region);
                    updateVis(d.region);
                    locked = d.region;
                } else if (locked == d.region) {
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
                    .html(d.region);
            })
            .on('mouseout', function () {
                hoverTooltip.classed('hidden', true);
                if (!locked) {
                    recolorMap("");
                }
            });

        function updateVis(region) {
            var regionSelect = document.getElementById('regionSelect');
            regionSelect.selectedIndex = regionNames.indexOf(region);
        }

        // color initially selected region
        var regionSelect = document.getElementById('regionSelect');
        var selectedRegion = regionSelect.options[regionSelect.selectedIndex].value;
        recolorMap(selectedRegion);


    });
});



