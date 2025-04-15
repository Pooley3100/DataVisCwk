const width = 800
const height = 600

//Grabbing elements
const tooltip = d3.select('#tooltip');
const crimeRateChloro = d3.select('g.map').attr("width", width).attr("height", height);
const compareChloro = d3.select('g.compare').attr("width", width).attr("height", height);
const mapLegend = d3.select('#mapLegend')
const mapLegendSecond = d3.select('#mapLegendSecond')

const projection = d3.geoMercator();
const geoGenerator = d3.geoPath().projection(projection);

var selectedYear = "2015";
var dataLoaded = false;
var parsedData = NaN;
var london_geoJson = NaN;

//Entry Point
Promise.all([
    d3.csv("parsed_data.csv"),
    d3.json("london_boroughs.geojson")
]).then(([csvData, geoJson]) => {
    csvData.forEach(d => {
        //Strip ,
        d["Median Salary"] = +d["Median Salary"].replace(/,/g, '');
        d["Crime Rate"] = +d["Crime Rate"].replace(/,/g, "");
    });
    parsedData = csvData;
    london_geoJson = geoJson;
    hotReload();
}).catch((err) => {
    console.log(err);
});

function loadMap(csvData, geoJson) {
    //wipe clean first
    crimeRateChloro.selectAll("*").remove();

    // Filter CSV for selected year
    const filteredData = csvData.filter(row => row.Year === selectedYear);
    //Re-adjust size
    projection.fitSize([width, height], geoJson);

    // Create a mapping of Borough to crimerate and clean data
    const crimeRateMap = new Map();
    filteredData.forEach(row => {
        crimeRateMap.set(row.Borough, +row["Crime Rate"]);
    });

    // Bind data to GeoJSON features
    geoJson.features.forEach(feature => {
        const boroughName = feature.properties.LAD13NM;
        feature.properties.crimerate = crimeRateMap.get(boroughName);
        feature.properties.name = boroughName
        //console.log(feature.properties.crimerate)
    });

    //console.log(geojson.features)
    // Draw map
    crimeRateChloro.selectAll("path")
        .data(geoJson.features)
        .enter().append("path")
        .attr("class", "region")
        .attr("d", geoGenerator)
        .attr("stroke", "#433")
        .attr("stroke-width", 2.5)
        .attr("fill", d => {
            //sets the colour of each country
            const value = d.properties.crimerate;
            return value ? d3.interpolateReds(value / 55000) : "#333";
        })
        //tooltips https://d3-graph-gallery.com/graph/interactivity_tooltip.html
        .on("mouseover", function (event, d) {
            tooltip.transition().duration(100).style("opacity", 1);
            tooltip.html(`${d.properties.name} has a crime rate of: ${d.properties.crimerate || "No Data"}`)
            d3.select(this).attr("fill", "blue");
        })
        .on("mousemove", function () {
            tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
        })
        // hide tooltip
        .on("mouseout", function (event, d) {
            tooltip.transition().duration(200).style("opacity", 0);
            d3.select(this).attr("fill", d => d.properties.crimerate ? d3.interpolateReds(d.properties.crimerate / 50000) : "#333");
        });
}

function loadMapCompare(csvData, geoJson) {
    //wipe clean first
    compareChloro.selectAll("*").remove();

    // Filter CSV for selected year
    const filteredData = csvData.filter(row => row.Year === selectedYear);
    //Re-adjust size
    projection.fitSize([width, height], geoJson);

    let maxSalary = 0;
    // Create a mapping of Borough to crimerate and clean data
    const compareMap = new Map();
    filteredData.forEach(row => {
        compareMap.set(row.Borough, row["Median Salary"]);
        maxSalary = Math.max(maxSalary, row["Median Salary"]);
    });
    //console.log(compareMap)

    // Bind data to GeoJSON features
    geoJson.features.forEach(feature => {
        const boroughName = feature.properties.LAD13NM;
        feature.properties.salary = compareMap.get(boroughName);
        feature.properties.name = boroughName
        //console.log(feature.properties.crimerate)
    });

    //console.log(geojson.features)
    // Draw map
    compareChloro.selectAll("path")
        .data(geoJson.features)
        .enter().append("path")
        .attr("class", "region")
        .attr("d", geoGenerator)
        .attr("stroke", "#433")
        .attr("stroke-width", 2.5)
        .attr("fill", d => {
            //sets the colour of each country
            const value = d.properties.salary;
            return value ? d3.interpolateBlues(value / maxSalary) : "#333";
        })
        //tooltips https://d3-graph-gallery.com/graph/interactivity_tooltip.html
        .on("mouseover", function (event, d) {
            tooltip.transition().duration(100).style("opacity", 1);
            tooltip.html(`${d.properties.name} has a median salry of: ${d.properties.salary || "No Data"}`)
            d3.select(this).attr("fill", "red");
        })
        .on("mousemove", function () {
            tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
        })
        // hide tooltip
        .on("mouseout", function (event, d) {
            tooltip.transition().duration(200).style("opacity", 0);
            d3.select(this).attr("fill", d => d.properties.salary ? d3.interpolateBlues(d.properties.salary / maxSalary) : "#333");
        });
}

function loadLegend(csvData) {
    //Wipe clean first
    mapLegend.selectAll("*").remove();

    //Colour scale and text
    const legendData = [0, 10000, 20000, 30000, 40000, 50000];
    const colourScale = d3.scaleThreshold().domain(legendData)
        .range(d3.schemeReds[7]);

    //Size of the boxes
    const legendWidth = 80;
    const boxWidth = 40
    const legendHeight = 100;

    const legendGroup = mapLegend
        .attr("width", legendWidth)
        .attr("height", legendHeight * legendData.length + 20)
        .append("g")
        .attr("transform", "translate(-20, 20)");

    legendGroup.selectAll("rect")
        .data(legendData)
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", (d, i) => i * legendHeight)
        .attr("width", boxWidth)
        .attr("height", legendHeight)
        .attr("fill", (d) => colourScale(d))

    legendGroup.selectAll("text")
        .data(legendData)
        .enter()
        .append("text")
        .attr("width", '100px')
        .attr("x", legendWidth - 35)
        .attr("y", (d, i) => i * legendHeight + legendHeight / 2)
        .text(d => `${d}`)
}

function loadLegendCompare(csvData) {
    //Wipe clean first
    mapLegendSecond.selectAll("*").remove();

    //Colour scale and text
    const legendData = [0, 10000, 20000, 30000, 40000, 50000];
    const colourScale = d3.scaleThreshold().domain(legendData)
        .range(d3.schemeBlues[7]);

    //Size of the boxes
    const legendWidth = 80;
    const boxWidth = 40
    const legendHeight = 100;

    const legendGroup = mapLegendSecond
        .attr("width", legendWidth)
        .attr("height", legendHeight * legendData.length + 20)
        .append("g")
        .attr("transform", "translate(-20, 20)");

    legendGroup.selectAll("rect")
        .data(legendData)
        .enter()
        .append("rect")
        .attr("x", 80)
        .attr("y", (d, i) => i * legendHeight)
        .attr("width", boxWidth)
        .attr("height", legendHeight)
        .attr("fill", (d) => colourScale(d))

    legendGroup.selectAll("text")
        .data(legendData)
        .enter()
        .append("text")
        .attr("width", '100px')
        .attr("x", legendWidth - 50)
        .attr("y", (d, i) => i * legendHeight + legendHeight / 2)
        .text(d => `${d}`)
}


function hotReload() {
    loadMap(parsedData, london_geoJson);
    loadLegend(parsedData);
    loadMapCompare(parsedData, london_geoJson)
    loadLegendCompare();
    createBarChat(parsedData);
}

var slider = document.getElementById("yearsInput");
slider.oninput = function () {
    var sliderValue = this.value;
    console.log(sliderValue)
    selectedYear = String(sliderValue);
    hotReload();
}

/*
 ----> Bar-Line chart retrieved and modified for crime data from: https://observablehq.com/@d3/bar-line-chart
*/
function createBarChat(csvData) {
    const filteredData = csvData.filter(row => row.Year === selectedYear);

    function _chart(d3, width, height, data, x, y1, line, xAxis, y1Axis, y2Axis) {
        const svg = d3.create("svg")
            .attr("viewBox", [0, 0, width, height]);

        svg.append("g")
            .attr("fill", "steelblue")
            .attr("fill-opacity", 0.8)
            .selectAll("rect")
            .data(data)
            .join("rect")
            .attr("x", d => x(d.Borough))
            .attr("width", x.bandwidth())
            .attr("y", d => y1(d["Crime Rate"]))
            .attr("height", d => y1(0) - y1(d["Crime Rate"]));

        svg.append("path")
            .attr("fill", "none")
            .attr("stroke", "currentColor")
            .attr("stroke-miterlimit", 1)
            .attr("stroke-width", 3)
            .attr("d", line(data));

        svg.append("g")
            .attr("fill", "none")
            .attr("pointer-events", "all")
            .selectAll("rect")
            .data(data)
            .join("rect")
            .attr("x", d => x(d.Borough))
            .attr("width", x.bandwidth())
            .attr("y", 0)
            .attr("height", height)
            .append("title")
            .text(d => `${d.Borough} Crime Rate: ${d["Crime Rate"]} and Median Salary ${d["Median Salary"]}`);

        svg.append("g")
            .call(xAxis);

        svg.append("g")
            .call(y1Axis);

        svg.append("g")
            .call(y2Axis);

        return svg.node();
    }

    function _line(d3, x, y2) {
        return (
            d3.line()
                .x(d => x(d.Borough) + x.bandwidth() / 2)
                .y(d => y2(d["Median Salary"]))
        )
    }

    function _x(d3, data, margin, width) {
        return (
            d3.scaleBand()
                .domain(data.map(d => d.Borough))
                .rangeRound([margin.left, width - margin.right])
                .padding(0.1)
        )
    }

    function _y1(d3, data, height, margin) {
        return (
            d3.scaleLinear()
                .domain([0, d3.max(data, d => d['Crime Rate'])])
                .rangeRound([height - margin.bottom, margin.top])
        )
    }

    function _y2(d3, data, height, margin) {
        return (
            d3.scaleLinear()
                .domain(d3.extent(data, d => d["Median Salary"]))
                .rangeRound([height - margin.bottom, margin.top])
        )
    }

    function _xAxis(height, margin, d3, x, width) {
        return g => g
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x))
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll("text")
                //Only take first word, avoid overlap
                .text(d => d.split(" ")[0])
                .style("font-size", "7px")
                .each(function (d, i) {
                    // alternate height such to avoid overlap
                    d3.select(this)
                        .attr("dy", i % 2 === 0 ? "1.2em" : "2.2em");
                }));
    }

    function _y1Axis(margin, d3, y1, data) {
        return (
            g => g
                .attr("transform", `translate(${margin.left},0)`)
                .style("color", "steelblue")
                .call(d3.axisLeft(y1).ticks(null, "s"))
                .call(g => g.select(".domain").remove())
                .call(g => g.append("text")
                    .attr("x", -margin.left)
                    .attr("y", 10)
                    .attr("fill", "currentColor")
                    .attr("text-anchor", "start")
                    .text("Crime Rate"))
        )
    }

    function _y2Axis(width, margin, d3, y2, data) {
        return (
            g => g
                .attr("transform", `translate(${width - margin.right - 12},0)`)
                .call(d3.axisRight(y2))
                .call(g => g.select(".domain").remove())
                .call(g => g.append("text")
                    .attr("x", margin.right)
                    .attr("y", 10)
                    .attr("fill", "currentColor")
                    .attr("text-anchor", "end")
                    .text('Salary'))
        )
    }

    const widthChart = 700;
    const heightChart = 200;
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    const x = _x(d3, filteredData, margin, widthChart);
    const y1 = _y1(d3, filteredData, heightChart, margin);
    const y2 = _y2(d3, filteredData, heightChart, margin);
    const line = _line(d3, x, y2);
    const xAxis = _xAxis(heightChart, margin, d3, x, widthChart);
    const y1Axis = _y1Axis(margin, d3, y1, filteredData);
    const y2Axis = _y2Axis(widthChart, margin, d3, y2, filteredData);

    const chart = _chart(d3, widthChart, heightChart, filteredData, x, y1, line, xAxis, y1Axis, y2Axis);
    // Assuming you have an HTML element with the ID "chart"
    const chartRem = d3.select("#chart");
    chartRem.selectAll("*").remove();
    document.getElementById("chart").appendChild(chart);
}
/*
End of Bar-Line Chart Code from Observable reference <-------
*/


/** TODOS
 * hover over boroughs to select
 * better text box on hover
 * card layout design
 * legend with scale of colour for two maps
 * select year bar
 * 
 * graph with bar and line to better compare
 */