var width = 960;
var height = 600;
var regionNames = ['FarWest', 'GreatLakes', 'GreatPlains', 'MidAtlantic', 'NewEngland',
    'OutlyingAreas', 'RockyMountains', 'Southeast', 'Southwest'];
var path = d3.geoPath();
var svg = d3.select('body')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

var regionSelect = d3.select('body')
    .append('g')
    .append('select')
    .attr('id', 'regionSelect');
regionNames.forEach(function (region, idx, arr) {
    regionSelect.append('option').text(region);
});

Number.prototype.pad = function (size) {
    var s = String(this);
    while (s.length < (size || 2)) { s = "0" + s; }
    return s;
}

d3.csv('csv/colleges.csv', function (d) {
    return {
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
}, function (error, csv) {
    if (error) throw error;


    d3.json('https://d3js.org/us-10m.v1.json', function (error, us) {
        if (error) throw error;
        var usjson = topojson.feature(us, us.objects.states);

        svg.append('g')
            .attr('class', 'states')
            .selectAll('path')
            .data(usjson.features)
            .enter().append('path')
            .attr('d', path)
            .classed('selected', function (d) {
                var val = d.properties.filled;
                if (val) {
                    return true;
                } else {
                    return false;
                }
            })
            .on('mouseover', function (d) {
                
            })
            .on('click', function (d) {

            });

        svg.append('path')
            .attr('class', 'state-borders')
            .attr('d', path(topojson.mesh(us, us.objects.states, function (a, b) { return a !== b; })));

        var regionSelect = document.getElementById('regionSelect');
        var selectedRegion = regionSelect.options[regionSelect.selectedIndex].value;
        recolorMap(selectedRegion);

        function recolorMap(selectedRegion) {
            svg.selectAll('path')
                .data(usjson.features)
                .classed('selected', false);
            d3.csv('csv/states.csv', function (d) {
                return {
                    ansi: (+d.STATE).pad(2),
                    stusab: d.STUSAB,
                    name: d.STATE_NAME,
                    statens: d.STATENS,
                    region: d.region
                };
            }, function (error, data) {
                var regionArr = [];
                if (error) throw error;
                data.forEach(function (d) {
                    if (d.region == selectedRegion) {
                        regionArr.push(d.ansi);
                    };
                });
                svg.selectAll('path')
                    .data(usjson.features)
                    .filter(function (d) {
                        return regionArr.indexOf(d.id) != -1;
                    })
                    .classed('selected', true);
            });
        }

        d3.select('#regionSelect')
            .on('click', function (d) {
                var regionSelect = document.getElementById('regionSelect');
                var selectedRegion = regionSelect.options[regionSelect.selectedIndex].value;
                recolorMap(selectedRegion);
            });
    });
});



