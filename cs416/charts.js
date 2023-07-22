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

function renderStart() {

    AppState.breadCrumb.html("");
    AppState.breadCrumb.append("li").append("a").attr("onclick", "renderStart()").text("Home");

    AppState.chartHeading.html("A Study of Licensed Drivers in the United States");
    AppState.chartArea.style("visibility", "hidden");
    AppState.chartArea.style("height", "0px");
    AppState.description.html(`
        This site provides a drill-down narative that walks a user through details of the amount of licensed drivers in the United States.
        Initially it gives an overview of the number of drivers in the US for the years 1994 through 2018.
        It then allows the user to explore individual numbers on a state by state basis.
        Lastly, it afords the user the ability to zoom in on demographics for each state (age & gender).
        A user can then draw various conclusions from the data.  One example could be to examine which states have younger vs. older drivers.
        It could also be paired with various population data on state and country levels, to equate drivers of various ages and eras to population bursts or declines.
        The dataset used to create the narrative is made publicly available by the Federal Highway Administration on the
        <a href="https://catalog.data.gov/dataset/licensed-drivers-by-state-gender-and-age-group" target="_blank">US Government's Open Data website</a>.
        <br><br><br><button onclick=\"renderLineChart()\" class=\"beginButton\">BEGIN</button><br><br>
    `);
}

function renderLineChart() {

    AppState.breadCrumb.html("");
    AppState.breadCrumb.append("li").append("a").attr("onclick", "renderStart()").text("Home");
    AppState.breadCrumb.append("li").append("a").attr("onclick", "renderLineChart()").text("Overview");

    AppState.chartHeading.html("Licensed drivers in the US from 1994 to 2018");
    AppState.chartArea.style("visibility", "visible");
    AppState.chartArea.style("height", `${BASE_HEIGHT}px`);
    AppState.chartArea.html("");
    AppState.description.html(`
        This scene provides a line chart illustration of the year over year change in the number of licensed drivers
        in the United States between the years 1994 and 2018 inclusive.  Users have the ability to drill down on each
        year to view state by state totals.
    `);

    const margin = { top: 10, right: 30, bottom: 20, left: 70 };
    const width = BASE_WIDTH - margin.left - margin.right;
    const height = BASE_HEIGHT - margin.top - margin.bottom;

    const svg = AppState.chartArea.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const tooltip = AppState.chartArea.append("div")
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("border-radius", "5px")
        .style("opacity", 0);

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
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(data.length).tickFormat(d3.format("d")));
    svg.append("text")
        .attr("text-anchor", "end")
        .attr("class", "axisLabel")
        .attr("x", width / 2)
        .attr("y", height - 6)
        .text("Year");

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
        .attr("d", d3.line().x((d) => x(d.Year)).y((d) => y(d.Drivers)))

    svg.selectAll("myCircles")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "point")
        .attr("stroke", "none")
        .attr("cx", (d) => x(d.Year))
        .attr("cy", (d) => y(d.Drivers))
        .attr("r", 6)
        .on("mouseover", function (d) {
            d3.select(this).transition().attr("r", 10);
            tooltip
                .html(`<b>${d.Year}</b>: ${d.Drivers.toLocaleString()}`)
                .style("left", `${d3.event.pageX + 15}px`)
                .style("top", `${d3.event.pageY - 28}px`)
                .style("opacity", 1)
                .transition()
                .duration(400)
        })
        .on("mouseout", function (d) {
            d3.select(this).transition().attr("r", 6);
            tooltip.transition().duration(300)
                .style("opacity", 0);
        })
        .on("click", (d) => {
            AppState.year = d.Year;
            renderChoropleth();
        })

    svg.append("text")
        .attr("text-anchor", "end")
        .attr("class", "axisLabel")
        .attr("y", 6)
        .attr("dy", ".75em")
        .attr("transform", "rotate(-90)")
        .text("Licensed Drivers");

    const annotations = [{
        note: {
            title: "Explore",
            label: "Hover over a point to see the exact number of licensed drivers for that year",
            bgPadding: 20
        },
        x: x(data[10].Year),
        y: y(data[10].Drivers),
        color: "purple",
        className: "show-bg",
        dy: -40,
        dx: -150,
        type: d3.annotationLabel
    }, {
        note: {
            title: "Drill Down",
            label: "Click on a point to explore data for each state for that year",
            bgPadding: 20
        },
        x: x(data[7].Year),
        y: y(data[7].Drivers),
        color: "purple",
        className: "show-bg",
        dy: 40,
        dx: 150,
        type: d3.annotationLabel
    }]


    for (var i = 1; i < data.length; ++i) {
        if (data[i - 1].Drivers > data[i].Drivers) {
            annotations.push({
                note: {
                    title: "Year in Decline",
                    label: `${data[i].Year} saw a decrease in total licensed drivers from the prior year`,
                    bgPadding: 20
                },
                color: "black",
                x: x(data[i].Year),
                y: y(data[i].Drivers),
                className: "show-bg",
                dy: 100,
                dx: 0,
                type: d3.annotationCallout
            })
        }
    }

    var currentMax = data[0].Year;
    var currentMaxDatum = data[0];
    for (var i = 1; i < data.length; ++i) {
        const delta = data[i].Drivers - data[i - 1].Drivers;
        if (delta > currentMax) {
            currentMax = delta;
            currentMaxDatum = data[i];
        }
    }

    annotations.push({
        note: {
            title: "Largest Jump",
            label: `${currentMaxDatum.Year} saw the largest increase in licensed drivers from the prior year (${currentMax.toLocaleString()})`,
            bgPadding: 20
        },
        color: "black",
        x: x(currentMaxDatum.Year),
        y: y(currentMaxDatum.Drivers),
        className: "show-bg",
        dy: 0,
        dx: -100,
        type: d3.annotationCallout
    })
    const makeAnnotations = d3.annotation().annotations(annotations);
    svg.append("g").attr("class", "annotation-group").call(makeAnnotations);
}

async function renderChoropleth() {

    AppState.breadCrumb.html("")
    AppState.breadCrumb.append("li").append("a").attr("onclick", "renderStart()").text("Home");
    AppState.breadCrumb.append("li").append("a").attr("onclick", "renderLineChart()").text("Overview");
    AppState.breadCrumb.append("li").append("a").attr("onclick", "renderChoropleth()").text(`Map (${AppState.year})`);

    AppState.chartHeading.html(`Licensed drivers by state for the year ${AppState.year}`)
    AppState.chartArea.html("")
    AppState.description.html(`
        This scene transitions to a choropleth which provides licensed driver totals for each state for the selected year.
        It allows the user to drill down on a specific state to view further detailed metrics for that state. 
        The coloring scale of states is logarithmic due to the large disparity in number of licensed drivers between
        the lowest and highest populated states.
    `);

    const lowColor = '#f9f9f9'
    const highColor = BASE_HIGH_COLOR;

    const projection = d3.geoAlbersUsa()
        .translate([BASE_WIDTH / 2, BASE_HEIGHT / 2])
        .scale([1000]);

    const path = d3.geoPath()
        .projection(projection);

    const svg = AppState.chartArea
        .append("svg")
        .attr("class", "choropleth")
        .attr("width", BASE_WIDTH - 110)
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

    const dataArray = [];
    for (var d = 0; d < data.length; d++) {
        dataArray.push(parseFloat(data[d].Drivers));
    }
    const minVal = d3.min(dataArray)
    const maxVal = d3.max(dataArray)
    const ramp = d3.scaleLog().domain([minVal, maxVal]).range([lowColor, highColor])

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
        .style("fill", (d) => ramp(d.properties.value))
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
            tooltip.html(`<b>${d.properties.name}</b>: ${d.properties.value.toLocaleString()}`)
                .style("left", `${d3.event.pageX - 100}px`)
                .style("top", `${d3.event.pageY - 50}px`)
                .transition().duration(400)
                .style("opacity", 1);
        })
        .on("mouseout", () => {
            d3.selectAll(".State")
                .transition()
                .duration(200)
                .style("opacity", 1)
                .style("stroke", "white")
            tooltip.transition().duration(300)
                .style("opacity", 0);
        })
        .on("click", (d) => {
            AppState.state = d.properties.name;
            renderBarChart();
        });

    const w = 110;
    const h = BASE_HEIGHT;

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
        .attr("spreadMethod", "pad")

    legend.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", highColor)
        .attr("stop-opacity", 1);

    legend.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", lowColor)
        .attr("stop-opacity", 1);

    key.append("rect")
        .attr("width", w - 75)
        .attr("height", h)
        .style("fill", "url(#gradient)")
        .attr("transform", "translate(0,60)");

    const y = d3.scaleLog()
        .range([h - 60, 0])
        .domain([minVal, maxVal])

    key.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(41,60)")
        .call(d3.axisRight(y).tickValues([500000, 1000000, 2000000, 5000000, 10000000, 20000000]).tickFormat(d3.format("~s")))

    key.append("text")
        .attr("text-anchor", "end")
        .attr("class", "axisLabel")
        .attr("y", 6)
        .attr("dy", ".75em")
        .attr("transform", "translate(65,200)rotate(-90)")
        .text("Licensed Drivers");

    const annotations = [{
        note: {
            title: "Explore",
            label: `Hover over a state to see the exact number of licensed drivers for ${AppState.year}`,
            bgPadding: 20
        },
        x: 750,
        y: 140,
        color: "purple",
        className: "show-bg",
        dy: -40,
        dx: -75,
        type: d3.annotationLabel
    }, {
        note: {
            title: "Drill Down",
            label: `Click on a state to explore detailed demographics for that state for ${AppState.year}`,
            bgPadding: 20
        },
        x: 575,
        y: 405,
        color: "purple",
        className: "show-bg",
        dy: 20,
        dx: 10,
        type: d3.annotationLabel
    }, {
        note: {
            title: "Young Drivers",
            label: "North Dakota is among 4 states that allow drivers under 16",
            bgPadding: 20
        },
        x: 440,
        y: 90,
        color: "black",
        className: "show-bg",
        dy: -30,
        dx: -25,
        type: d3.annotationLabel
    }]

    const makeAnnotations = d3.annotation().annotations(annotations);
    svg.append("g").attr("class", "annotation-group").call(makeAnnotations);
}

function renderBarChart() {

    AppState.breadCrumb.html("")
    AppState.breadCrumb.append("li").append("a").attr("onclick", "renderStart()").text("Home");
    AppState.breadCrumb.append("li").append("a").attr("onclick", "renderLineChart()").text("Overview");
    AppState.breadCrumb.append("li").append("a").attr("onclick", "renderChoropleth()").text(`Map (${AppState.year})`);
    AppState.breadCrumb.append("li").append("a").text(`${AppState.state} Demographics`);

    AppState.chartHeading.html(`${AppState.state} driver demographics for the year ${AppState.year}`)
    AppState.chartArea.html("")
    AppState.description.html(`
        This scene provides the greatest level of detail with a bar chart that allows the user to explore specific details based on age and gender for the selected year and state.
        Drilling down on an age group will provide the number of female and male drivers for the group, and the percentage of the group that each represents.  The user will also
        be provided with the total number of drivers in that group, and the percentage that the selected age group represents for ${AppState.state} in ${AppState.year}.
    `);

    var margin = { top: 10, right: 30, bottom: 90, left: 60 }
    const width = BASE_WIDTH - margin.left - margin.right
    const height = BASE_HEIGHT - margin.top - margin.bottom;

    var svg = AppState.chartArea
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const tooltip = AppState.chartArea.append("div")
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("border-radius", "5px")
        .style("opacity", 0);

    const data = [];
    const acc = {};
    AppState.rawData.forEach((value) => {
        if (value.Year === AppState.year && value.State === AppState.state) {
            const ageGroup = AGE_GROUP_U24_MAP.get(value.Cohort) ?? value.Cohort;

            if (!acc[ageGroup]) {
                const group = { AgeGroup: ageGroup, MaleDrivers: 0, FemaleDrivers: 0, Drivers: 0 };
                acc[ageGroup] = group;
                data.push(group);
            }
            acc[ageGroup].Drivers = Number(value.Drivers) + acc[ageGroup].Drivers;
            if (value.Gender === "Female") {
                acc[ageGroup].FemaleDrivers = Number(value.Drivers) + acc[ageGroup].FemaleDrivers;
            } else {
                acc[ageGroup].MaleDrivers = Number(value.Drivers) + acc[ageGroup].MaleDrivers;
            }
        }
    });

    const x = d3.scaleBand()
        .range([0, width])
        .domain(data.map((d) => d.AgeGroup))
        .padding(0.2);
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");
    svg.append("text")
        .attr("text-anchor", "end")
        .attr("class", "axisLabel")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .text("Age Group");

    const dataArray = [];
    var stateDriversForYear = 0;
    for (var d = 0; d < data.length; d++) {
        dataArray.push(parseFloat(data[d].Drivers));
        stateDriversForYear = stateDriversForYear + data[d].Drivers;
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
        .attr("x", (d) => x(d.AgeGroup))
        .attr("width", x.bandwidth())
        .attr("fill", BASE_HIGH_COLOR)
        .attr("height", () => height - y(0))
        .attr("y", () => y(0))
        .on("mouseover", (d) => {
            const femalePercent = d.FemaleDrivers * 100 / d.Drivers;
            const malePercent = d.MaleDrivers * 100 / d.Drivers;
            const totalPercent = d.Drivers * 100 / stateDriversForYear;
            tooltip
                .html(`
                    <b>Age Group:</b> ${d.AgeGroup}
                    <br><b>Female Drivers:</b> ${d.FemaleDrivers.toLocaleString()} (${femalePercent.toFixed(2)}%)
                    <br><b>Male Drivers:</b> ${d.MaleDrivers.toLocaleString()} (${malePercent.toFixed(2)}%)
                    <br><b>Total Drivers:</b> ${d.Drivers.toLocaleString()} (${totalPercent.toFixed(2)}%)
                `)
                .style("left", `${d3.event.pageX + 15}px`)
                .style("top", `${d3.event.pageY - 28}px`)
                .style("opacity", 1)
                .transition()
                .duration(400)
        })
        .on("mouseout", () => {
            tooltip.transition().duration(300).style("opacity", 0);
        })

    svg.selectAll("rect")
        .transition()
        .duration(800)
        .attr("y", (d) => y(d.Drivers))
        .attr("height", (d) => height - y(d.Drivers))
        .delay((_, i) => (i * 100))

    svg.append("text")
        .attr("text-anchor", "end")
        .attr("class", "axisLabel")
        .attr("y", 6)
        .attr("dy", ".75em")
        .attr("transform", "translate(-65,300)rotate(-90)")
        .text("Licensed Drivers");

    var currentMaxDelta = 0;
    var currentMaxIndex = 0;
    for (var i = 1; i < data.length; ++i) {
        const delta = Math.abs(data[i].FemaleDrivers - data[i].MaleDrivers) * 100 / data[i].Drivers
        if (delta > currentMaxDelta) {
            currentMaxDelta = delta;
            currentMaxIndex = i;
        }
    }

    const annotations = [{
        note: {
            title: "Gender Factor",
            label: `This age group saw the largest disparity in gender ratio: ${currentMaxDelta.toFixed(2)}%`,
            bgPadding: 20
        },
        x: x(data[currentMaxIndex].AgeGroup) + (currentMaxIndex <= 2 ? 30 : 0),
        y: 390,
        color: "black",
        className: "show-bg",
        dy: 40,
        dx: currentMaxIndex <= 2 ? 20 : -20,
        type: d3.annotationLabel
    }, {
        note: {
            title: "Explore",
            label: "Hover over a bar to see totals and gender based metrics",
            bgPadding: 20
        },
        x: 20,
        y: 390,
        color: "purple",
        className: "show-bg",
        dy: 40,
        dx: -20,
        type: d3.annotationLabel
    }]

    const makeAnnotations = d3.annotation().annotations(annotations);
    setTimeout(() => svg.append("g").attr("class", "annotation-group").call(makeAnnotations), data.length * 100);
}

async function init() {
    AppState.rawData = await d3.csv("licensed_drivers.csv");
    AppState.breadCrumb = d3.select(".breadcrumb");
    AppState.chartHeading = d3.select("#chart-heading");
    AppState.chartArea = d3.select("#chart-area");
    AppState.description = d3.select("#scene-description");
    renderStart();
}