const BASE_WIDTH = 960;
const BASE_HEIGHT = 500;
const BASE_HIGH_COLOR = '#3c22b3'
const AGE_GROUP_U24_MAP = new Map([
    ["Under 16", "Under 20"],
    ["16", "Under 20"],
    ["17", "Under 20"],
    ["18", "Under 20"],
    ["19", "Under 20"],
    ["20", "20-24"],
    ["21", "20-24"],
    ["22", "20-24"],
    ["23", "20-24"],
    ["24", "20-24"]
]);
const AppState = {}

function renderLineChart() {

    AppState.breadCrumb.html("")
    AppState.breadCrumb.append("li").append("a").attr("onclick", "renderLineChart()").text("Home");

    AppState.chartHeading.html("Licensed drivers in the US from 1994 to 2018")
    AppState.chartArea.html("");
    const margin = { top: 10, right: 30, bottom: 20, left: 70 };
    const width = BASE_WIDTH - margin.left - margin.right;
    const height = BASE_HEIGHT - margin.top - margin.bottom;

    const svg = AppState.chartArea.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const data = [];
    const acc = {}
    AppState.rawData.forEach((value) => {
        if (!acc[value.Year]) {
            const yearObj = { Year: value.Year, Drivers: 0 };
            acc[value.Year] = yearObj;
            data.push(yearObj);
        }
        acc[value.Year].Drivers = Number(value.Drivers) + acc[value.Year].Drivers;
    });
    data.sort((a, b) => (a.Year - b.Year));

    const x = d3.scaleLinear()
        .domain(d3.extent(data, (d) => d.Year))
        .range([0, width]);
    svg.append("g")
        .attr("transform", "translate(0," + (height) + ")")
        .call(d3.axisBottom(x).ticks(data.length).tickFormat(d3.format("d")));

    const y = d3.scaleLinear()
        .domain(d3.extent(data, (d) => d.Drivers))
        .range([height, 0]);
    svg.append("g")
        .attr("transform", "translate(-5,0)")
        .call(d3.axisLeft(y));

    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", BASE_HIGH_COLOR)
        .attr("stroke-width", 4)
        .attr("d", d3.line()
            .x(function (d) { return x(d.Year) })
            .y(function (d) { return y(d.Drivers) })
        )

    svg.selectAll("myCircles")
        .data(data)
        .enter()
        .append("circle")
        .attr("fill", "grey")
        .attr("stroke", "none")
        .attr("cx", function (d) { return x(d.Year) })
        .attr("cy", function (d) { return y(d.Drivers) })
        .attr("r", 6)
        .on("mouseover", function (d) {
            d3.select(this).transition().attr("r", 10);
        })
        .on("mouseout", function (d) {
            d3.select(this).transition().attr("r", 6);
        })
        .on("click", function (d) {
            AppState.year = d.Year;
            renderChoropleth();
        })
}

async function renderChoropleth() {

    AppState.breadCrumb.html("")
    AppState.breadCrumb.append("li").append("a").attr("onclick", "renderLineChart()").text("Home");
    AppState.breadCrumb.append("li").append("a").attr("onclick", "renderChoropleth()").text("US Map");

    AppState.chartHeading.html(`Licensed drivers by state for the year ${AppState.year}`)
    AppState.chartArea.html("")
    const lowColor = '#f9f9f9'
    const highColor = BASE_HIGH_COLOR;

    const projection = d3.geoAlbersUsa()
        .translate([BASE_WIDTH / 2, BASE_HEIGHT / 2])
        .scale([1000]);

    const path = d3.geoPath()
        .projection(projection);

    const svg = AppState.chartArea
        .append("svg")
        .attr("width", BASE_WIDTH)
        .attr("height", BASE_HEIGHT);

    const tooltip = AppState.chartArea.append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    const data = []
    const acc = {}
    AppState.rawData.forEach((value) => {
        if (value.Year === AppState.year) {
            if (!acc[value.State]) {
                const stateObj = { State: value.State, Drivers: 0 };
                acc[value.State] = stateObj;
                data.push(stateObj);
            }
            acc[value.State].Drivers = Number(value.Drivers) + acc[value.State].Drivers;
        }
    });

    var dataArray = [];
    for (var d = 0; d < data.length; d++) {
        dataArray.push(parseFloat(data[d].Drivers))
    }
    var minVal = d3.min(dataArray)
    var maxVal = d3.max(dataArray)
    var ramp = d3.scaleLog().domain([minVal, maxVal]).range([lowColor, highColor])

    const json = await d3.json("us-states.json")
    for (var i = 0; i < data.length; i++) {
        const dataState = data[i].State;
        const dataValue = data[i].Drivers;
        for (var j = 0; j < json.features.length; j++) {
            const jsonState = json.features[j].properties.name;
            if (dataState == jsonState) {
                json.features[j].properties.value = dataValue;
                break;
            }
        }
    }

    svg.selectAll("path")
        .data(json.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "State")
        .style("stroke", "#fff")
        .style("stroke-width", "1")
        .style("fill", function (d) { return ramp(d.properties.value) })
        .on("mouseover", function (d) {
            d3.selectAll(".State")
                .transition()
                .duration(200)
                .style("opacity", .5)
                .style("stroke", "transparent");
            d3.select(this)
                .transition()
                .duration(200)
                .style("opacity", 1)
                .style("stroke", "black");
            tooltip.style("left", (d3.event.pageX + 15) + "px")
                .style("top", (d3.event.pageY - 28) + "px")
                .transition().duration(400)
                .style("opacity", 1)
                .text(d.properties.name + ': ' + d.properties.value.toLocaleString());
        })
        .on("mouseout", function (d) {
            d3.selectAll(".State")
                .transition()
                .duration(200)
                .style("opacity", 1)
                .style("stroke", "white")
            tooltip.transition().duration(300)
                .style("opacity", 0);
        })
        .on("click", function (d) {
            AppState.state = d.properties.name;
            renderBarChart();
        });

    const w = 140;
    const h = 300;

    const key = AppState.chartArea
        .append("svg")
        .attr("width", w)
        .attr("height", h)
        .attr("class", "legend");

    const legend = key.append("defs")
        .append("svg:linearGradient")
        .attr("id", "gradient")
        .attr("x1", "100%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "100%")
        .attr("spreadMethod", "pad");

    legend.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", highColor)
        .attr("stop-opacity", 1);

    legend.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", lowColor)
        .attr("stop-opacity", 1);

    key.append("rect")
        .attr("width", w - 100)
        .attr("height", h)
        .style("fill", "url(#gradient)")
        .attr("transform", "translate(0,40)");

    var y = d3.scaleLinear()
        .range([h, 0])
        .domain([minVal, maxVal]);

    key.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(41,40)")
        .call(d3.axisRight(y))
}

function renderBarChart() {

    AppState.breadCrumb.html("")
    AppState.breadCrumb.append("li").append("a").attr("onclick", "renderLineChart()").text("Home");
    AppState.breadCrumb.append("li").append("a").attr("onclick", "renderChoropleth()").text("US Map");
    AppState.breadCrumb.append("li").append("a").text("State Demographics");

    AppState.chartHeading.html(`${AppState.state} driver demographics for the year of ${AppState.year}`)
    AppState.chartArea.html("")

    var margin = { top: 10, right: 30, bottom: 90, left: 60 }
    const width = BASE_WIDTH - margin.left - margin.right
    const height = BASE_HEIGHT - margin.top - margin.bottom;

    var svg = AppState.chartArea
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const data = [];
    const acc = {};
    AppState.rawData.forEach((value) => {
        if (value.Year === AppState.year && value.State === AppState.state) {
            const ageGroup = AGE_GROUP_U24_MAP.get(value.Cohort) ?? value.Cohort;

            if (!acc[ageGroup]) {
                const group = { AgeGroup: ageGroup, Drivers: 0 };
                acc[ageGroup] = group;
                data.push(group);
            }
            acc[ageGroup].Drivers = Number(value.Drivers) + acc[ageGroup].Drivers;
        }
    });

    const x = d3.scaleBand()
        .range([0, width])
        .domain(data.map(function (d) { return d.AgeGroup; }))
        .padding(0.2);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

    const dataArray = [];
    for (var d = 0; d < data.length; d++) {
        dataArray.push(parseFloat(data[d].Drivers))
    }
    const maxVal = d3.max(dataArray)

    const y = d3.scaleLinear()
        .domain([0, maxVal])
        .range([height, 0]);
    svg.append("g")
        .call(d3.axisLeft(y));

    svg.selectAll("bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", function (d) { return x(d.AgeGroup); })
        .attr("width", x.bandwidth())
        .attr("fill", BASE_HIGH_COLOR)
        .attr("height", function (d) { return height - y(0); }) 
        .attr("y", function (d) { return y(0); })

    svg.selectAll("rect")
        .transition()
        .duration(800)
        .attr("y", function (d) { return y(d.Drivers); })
        .attr("height", function (d) { return height - y(d.Drivers); })
        .delay(function (d, i) { return (i * 100) })
}

async function init() {
    AppState.rawData = await d3.csv("licensed_drivers.csv");
    AppState.breadCrumb = d3.select(".breadcrumb")
    AppState.chartHeading = d3.select("#chart-heading")
    AppState.chartArea = d3.select("#chart-area");
    renderLineChart();
}