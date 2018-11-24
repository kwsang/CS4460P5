var width = 940;
var height = 600;
var regionWidth = 600;
var regionHeight = 400;

var regionNames = ['FarWest', 'GreatLakes', 'GreatPlains', 'MidAtlantic', 'NewEngland',
    'OutlyingAreas', 'RockyMountains', 'Southeast', 'Southwest'];

// create region selector
var regionSelect = d3.select('#access-row')
    .append('g')
    .append('select')
    .attr('id', 'regionSelect');
regionNames.forEach(function (region, idx, arr) {
    regionSelect.append('option').text(region);
});
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
    .defer(d3.csv, 'csv/colleges.csv', function (d) {
        return {
            // parse project data
            control: d['Control'],
            region: d['Region'],
            locale: d['Locale'],
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
    })
    .defer(d3.csv, 'csv/states.csv', function (d) {
        return {
            ansi: (+d.STATE).pad(2),
            stusab: d.STUSAB,
            name: d.STATE_NAME,
            statens: d.STATENS,
            region: d.region
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
                .html(d.region + "<br />");
            generateTooltip(d.region);
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

    function generateTooltip(region) {
        collegeCSV.filter(function (d) {
            return d.region == selectedRegion;
        })
        d3.select('#tooltip')
            .append('g')

    }

    function updateVis(region) {
        var regionSelect = document.getElementById('regionSelect');
        regionSelect.selectedIndex = regionNames.indexOf(region);
    }

    // color initially selected region
    var regionSelect = document.getElementById('regionSelect');
    var selectedRegion = regionSelect.options[regionSelect.selectedIndex].value;
    recolorMap(selectedRegion);

    scroll.on('active', function (index) {
        // highlight current step text
        d3.selectAll('.step')
            .style('opacity', function (d, i) { return i === index ? 1 : 0.1; });
    });

    scroll.on('progress', function (index, progress) {
    });
}



