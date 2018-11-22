var width = 960;
var height = 600;
var regionNames = ['FarWest', 'GreatLakes', 'GreatPlains', 'MidAtlantic', 'NewEngland',
    'OutlyingAreas', 'RockyMountains', 'Southeast', 'Southwest'];
var path = d3.geoPath();
var svg = d3.select('body')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

// create region selector
var regionSelect = d3.select('body')
    .append('g')
    .append('select')
    .attr('id', 'regionSelect');
regionNames.forEach(function (region, idx, arr) {
    regionSelect.append('option').text(region);
});
// method to create leading zeroes
Number.prototype.pad = function (size) {
    var s = String(this);
    while (s.length < (size || 2)) { s = "0" + s; }
    return s;
}

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
    }, function (error, states) {
        // d3 map function
        d3.json('https://d3js.org/us-10m.v1.json', function (error, us) {
            if (error) throw error;
            // create map features
            var usjson = topojson.feature(us, us.objects.states);
            // save states data onto d3 map features
            for (var i = 0; i < usjson.features.length; i++) {
                var state = usjson.features[i];
                for (var j = 0; j < states.length; j++) {
                    if (state.id == states[j].ansi) {
                        state.name = states[j].name;
                        state.region = states[j].region;
                        break;
                    }
                }
            }
            // enable dropdown selector function
            d3.select('#regionSelect')
                .on('click', function (d) {
                    var regionSelect = document.getElementById('regionSelect');
                    var selectedRegion = regionSelect.options[regionSelect.selectedIndex].value;
                    recolorMap(selectedRegion);
                });
            // region coloring method
            function recolorMap(selectedRegion) {
                svg.selectAll('path')
                    .data(usjson.features)
                    .classed('selected', false);
                if (error) throw error;
                svg.selectAll('path')
                    .data(usjson.features)
                    .filter(function (d) {
                        return d.region == selectedRegion;
                    })
                    .classed('selected', true);
            };
            // draw states using map features
            svg.append('g')
                .attr('class', 'states')
                .selectAll('path')
                .data(usjson.features)
                .enter().append('path')
                .attr('d', path)
                // highlight selected states
                .classed('selected', function (d) {
                    if (d.properties.filled) {
                        return true;
                    } else {
                        return false;
                    }
                })
                .on('mouseover', function (d) {
                    recolorMap(d.region);
                })
                .on('click', function (d) {

                });

            // draw state boundaries
            svg.append('path')
                .attr('class', 'state-borders')
                .attr('d', path(topojson.mesh(us, us.objects.states, function (a, b) { return a !== b; })));

            // color initially selected region
            var regionSelect = document.getElementById('regionSelect');
            var selectedRegion = regionSelect.options[regionSelect.selectedIndex].value;
            recolorMap(selectedRegion);
        });
    });
});



