/* The driving file for all the visualizations.
Tasks:
  Set up the introduction page
  Extract data from CSV file and filter and fix as required
  Render the time series world map.
    Projection: geoMercator
    Data: Shows number of new cases per country per month
  Call other functions to render all other visualizations
Functions:
  intervalFunction() - to handle time series data on the map with the play button
  updateColors() - to update colors on map based on number of new cases
*/

/* Imports */
import { drawHeatmap } from "./heatmap.js";
import { drawLineChart } from "./linechart.js";
import { renderLineChart } from "./linechart.js";
import { updateLineChart } from "./linechart.js";
import { renderBubbleChart } from "./bubblechart.js";
import { scatterPlot } from "./kmeans.js";

// Define the dimensions and margins of the plot and other variables
var margin = { top: 80, right: 30, bottom: 30, left: 5 },
  svgWidth = 900 - margin.left - margin.right,
  svgHeight = 473 - margin.top - margin.bottom,
  bubbleMargin = { top: 20, bottom: 50, left: 50, right: 30 },
  bubbleWidth = 500 - bubbleMargin.left - bubbleMargin.right,
  bubbleHeight = 480 - bubbleMargin.top - bubbleMargin.bottom,
  bubbleChart,
  wave1year = 2020,
  wave1month = 3,
  wave2year = 2021,
  wave2month = 3,
  wave3year = 2021,
  wave3month = 5;

export { wave1month };
export { wave1year };
export { wave2month };
export { wave2year };
export { wave3month };
export { wave3year };

/* For the introduction page */

// Select all the <p> elements within the .bullet-points div
const bulletPoints = d3.select(".bullet-points").selectAll("p");

// Set the initial styles for the text
bulletPoints.style("opacity", "0").style("transform", "translateX(-100px)");

// Animate the text to fade in and move in from the left
bulletPoints
  .transition()
  .duration(1000)
  .delay((d, i) => i * 500)
  .style("opacity", "1")
  .style("transform", "translateX(0)");

const intervalDelay = 1000;
// Create a mapping object to store iso_code -> country_name mapping
var isoToCountry = {};
var gdpData = {};
export { gdpData };

var bubbleSvg;
export { bubbleSvg };

/* For use in bubble chart. Default set of countries */
var myIsoCodes = [
  "USA",
  "CHN",
  "AUS",
  "GUY",
  "CAF",
  "VUT",
  "GRL",
  "PHL",
  "FRA",
];

const tooltip = d3
  .select(".main-container")
  .append("div")
  .attr("class", "tooltip-c")
  .style("opacity", 0)
  .style("position", "absolute");

var dataForAMonth_g = {}; // global variable;

const group = d3.select(".map-container");

// Main svg for the map
var svg = group
  .append("svg")
  .attr("class", "svg-c")
  .attr("width", svgWidth + margin.left + margin.right)
  .attr("height", svgHeight + margin.top + margin.bottom)
  .attr("max-width", "100%")
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

/* Play button for the time series map */

group
  .append("div")
  .attr("id", "play-c")
  .attr("transform", "translate(0, " + (svgHeight - 60) + ")")
  .append("button")
  .attr("id", "play-button")
  .attr("class", "play-c")
  .text("▶");

bubbleSvg = d3
  .select(".bubble-container")
  .append("svg")
  .attr("width", bubbleWidth + bubbleMargin.left + bubbleMargin.right)
  .attr("height", bubbleHeight + bubbleMargin.top + bubbleMargin.bottom)
  .attr("max-width", "100%");

drawLineChart("line-chart-container");

// Create projection to map the latitudes and longitudes to x and y
const projection = d3
  .geoMercator()
  .rotate([-10, 0]) // Adjust the rotation of the projection
  .translate([svgWidth / 2, svgHeight / 2]) // To centre it.
  .scale(120);

// Create path using the projection. Pass it to the d attribute of path
const path = d3.geoPath().projection(projection);

const formatNumber = d3.format(".2s");
const formatTime = d3.timeFormat("%B, %Y");

export function filterData(month, year, data) {
  //console.log(data);
  const dataForAMonth = data.filter(
    (d) => d.year === year && d.month === month
  );
  dataForAMonth_g = dataForAMonth;

  //console.log(dataForAMonth);

  // Extract the relevant data from the CSV file
  var dataForAMonth_map = dataForAMonth.map(function (d) {
    return {
      location: d.location,
      iso_code: d.iso_code,
      continent: d.continent,
      total_vaccinations: isNaN(parseFloat(d.total_vaccinations))
        ? 0
        : parseFloat(d.total_vaccinations),
      population: isNaN(parseFloat(d.population))
        ? 0
        : parseFloat(d.population),
      vacc_rate: isNaN(parseFloat(d.vacc_rate)) ? 0 : parseFloat(d.vacc_rate),
      total_deaths: isNaN(parseFloat(d.total_deaths))
        ? 0
        : parseFloat(d.total_deaths),
      new_cases: isNaN(parseFloat(d.new_cases)) ? 0 : parseFloat(d.new_cases),
      total_cases: isNaN(parseFloat(+d.total_cases))
        ? 0
        : parseFloat(d.total_cases),
      month: d.month,
      year: d.year,
      gdp_per_capita: +d.gdp_per_capita,
      stringency_index: isNaN(parseFloat(d.stringency_index))
        ? 0
        : parseFloat(d.stringency_index),
      population_density: +d.population_density,
    };
  });

  return dataForAMonth_map;
}

// ---------------------------------------------------------------------------------------------------

Promise.all([
  d3.json("./data/map/world.geojson"),
  d3.csv("./data/monthly_all.csv"),
]).then(function ([world, monthly]) {
  scatterPlot(monthly, "clustergroup");

  // Create a map of country names to data for that country
  var dataMap = d3.group(monthly, function (d) {
    return d.location;
  });

  // console.log("DataMap:");
  // console.log(dataMap);

  // Loop through the data and populate the mapping object
  monthly.forEach(function (d) {
    isoToCountry[d.iso_code] = d.location;
  });

  var minCases = d3.min(monthly, function (d) {
    return +d.new_cases;
  });

  var maxCases = d3.max(monthly, function (d) {
    return +d.new_cases;
  });

  console.log(minCases + ", " + maxCases);

  // Convert the year and month columns to numeric values
  monthly.forEach((d) => {
    d.year = +d.year;
    d.month = +d.month;
    d.new_cases = +d.new_cases;
    d.total_cases = +d.total_cases;
  });

  gdpData = monthly.filter(
    (d) => d.year === wave2year && d.month === wave2month
  );
  console.log("gdpData for heatmap.js:");
  console.log(gdpData);

  /* Drawing heat map */
  drawHeatmap("gdpgroup");
  d3.select("#heatmap-option3").style("font-weight", "bold");

  var yearToFilter = 2020;
  var monthToFilter = 2;

  let intervalId = null;
  let index = 0;
  var count = 0;
  const maxCount = 38,
    casesByCountry = {};
  var periodItem = svg;

  const colorScale = d3
    .scaleThreshold()
    .range(["#fee5d9", "#fcbba1", "#fc9272", "#fb6a4a", "#de2d26"])
    .domain([
      d3.max(monthly, (d) => d.new_cases) / 10000,
      d3.max(monthly, function (d) {
        return d.new_cases;
      }) / 5000,
      d3.max(monthly, (d) => d.new_cases) / 1250,
      d3.max(monthly, (d) => d.new_cases) / 156.25,
      d3.max(monthly, (d) => d.new_cases) / 9.765,
      d3.max(monthly, (d) => d.new_cases),
    ]);

  const period = d3
    .select(".svg-c")
    .append("g")
    .attr("class", "period-c")
    .attr("transform", "translate(20, " + (svgHeight - 60) + ")");

  periodItem = period
    .append("g")
    .attr("class", "period-item")
    .attr("transform", "translate(0, 0)")
    .append("text")
    .attr("x", 0)
    .attr("y", 15)
    .attr("width", 40)
    .attr("height", 20)
    .text(formatTime(new Date(yearToFilter, monthToFilter - 1)))
    .attr("class", "period-text")
    .style("font-family", "serif");

  period
    .append("text")
    .html("New cases as of<br><br>")
    .attr("class", "map-text");

  // Create a legend container
  const legend = d3
    .select(".svg-c")
    .append("g")
    .attr("class", "legend-c")
    .attr("transform", "translate(20, " + (svgHeight - 10) + ")");

  // Add legend items
  const legendItems = legend
    .selectAll(".legend-item")
    .data(colorScale.range())
    .enter()
    .append("g")
    .attr("class", "legend-item")
    .attr("transform", (d, i) => `translate(0, ${i * 22})`);

  legendItems
    .append("rect")
    .attr("class", function (d, i) {
      return "legend-item-box";
    })
    .attr("width", 20)
    .attr("height", 20)
    .attr("rx", 5)
    .attr("fill", (d) => d);

  legendItems
    .attr("class", function (d, i) {
      return "legend-item";
    })
    .append("text")
    .attr("class", function (d, i) {
      return "legend-item-text";
    })
    .text(function (d, i) {
      var labels = colorScale.domain();
      return " < " + formatNumber(Math.ceil(labels[i + 1]));
    })
    .attr("x", 30)
    .attr("y", 15)
    .attr("width", 20)
    .attr("height", 20);

  var countries = svg
    .selectAll(".country")
    .data(world.features)
    .enter()
    .append("path")
    .attr("class", "country")
    .attr("id", (d) => d.id)
    .attr("d", path)
    .attr("fill", "#ffffff")
    .attr("stroke", "#aaaaaa")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  const bubbleContainer = d3.select(".bubble-container");
  const options = {
    root: null,
    rootMargin: "0px",
    threshold: 1.0,
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        renderBubbleChart(yearToFilter, monthToFilter, monthly, myIsoCodes);
        var myElement = d3.select(".play-c");

        // append a tooltip to the element
        var tooltip1 = myElement
          .append("div")
          .attr("class", "tooltip1-c")
          .style("opacity", 0)
          .style("position", "absolute")
          .html(
            "<br><strong>Play, Pause, Brush!</strong><br><br>to see the impact across <br><br>countries and continents <br><br>over time. <br><br>"
          )
          .style("padding", "0 5px")
          .style("background", "white")
          .style("border-radius", "10px")
          .style("z-index", "9999")
          .style("border-color", "red")
          .style("border-style", "solid")
          .style("border-width", "1px")
          .transition()
          .duration(2000)
          .style("opacity", 1)
          .on("end", function () {
            // make the tooltip disappear after 3 seconds
            tooltip1
              .transition()
              .duration(1000)
              .delay(3000)
              .style("opacity", 0)
              .remove();
          });

        observer.unobserve(entry.target);
      }
    });
  }, options);

  observer.observe(bubbleContainer.node());

  bubbleChart = d3.select("#bubblechart");
  var dataForAMonth = monthly.filter(
    (d) => d.year === yearToFilter && d.month === monthToFilter
  );

  updateColors(yearToFilter, monthToFilter, dataForAMonth);

  yearToFilter = 2020;
  monthToFilter = 2;

  renderLineChart(dataMap, svgHeight);
  updateLineChart();

  // Set up the play button
  const button = d3.select("#play-button");

  countries
    .on("mouseover", function (event, d) {
      //console.log(d);
      d3.select(this).style("opacity", 0.7);

      var cases =
        typeof casesByCountry[d.id] == "undefined"
          ? 0
          : casesByCountry[d.id].toFixed(0);

      tooltip
        .html(
          "<div class=tooltip>" +
            d.properties.name +
            "<br> Cases: " +
            (typeof casesByCountry[d.id] == "undefined"
              ? 0
              : casesByCountry[d.id].toFixed(0)) +
            "</div>"
        )
        .style("left", event.pageX + 2 + "px")
        .style("top", event.pageY + 2 + "px")
        .style("position", "absolute")
        .style("padding", "0 5px") // This means 0px at the top and bottom
        // and 10 on the left and right
        .style("background", "white")
        .style("border-radius", "10px")
        .transition()
        .duration(100)
        .style("opacity", 0.7);
    })
    .on("mouseout", function (event, d) {
      d3.select(this).style("opacity", 1);
      tooltip.transition().duration(0).style("opacity", 0);
    });

  // ---------------------------------------------------------------------------------------------------
  /* Managing the time series on the map */

  button.on("click", function () {
    index = 0;
    if (intervalId) {
      console.log("PAUSED");
      // If the interval is already running, stop it
      clearInterval(intervalId);
      intervalId = null;
      button.text("▶");

      if (bubbleChart) {
        bubbleChart.remove();
      }

      if (monthToFilter == 1) {
        monthToFilter = 12;
        yearToFilter--;
      } else {
        monthToFilter--;
      }

      renderBubbleChart(yearToFilter, monthToFilter, monthly, myIsoCodes);
    } else if (count < maxCount) {
      console.log("STARTED");
      intervalId = setInterval(intervalFunction, intervalDelay);
      console.log(intervalId);
      button.text("⏸");
    } else {
      console.log("STOPPED");
      // Otherwise, start the interval
      intervalId = setInterval(intervalFunction, intervalDelay);
      console.log(intervalId);
      button.text("◾");
    }
  });

  function intervalFunction() {
    count++;
    //console.log("Function called " + count + " times");

    // console.log(
    //   "Data for year: " + yearToFilter + "and month: " + monthToFilter
    // );
    var dataForAMonth = monthly.filter(
      (d) => d.year === yearToFilter && d.month === monthToFilter
    );
    // console.log(dataForAMonth);

    periodItem.text(formatTime(new Date(yearToFilter, monthToFilter - 1)));
    updateColors(yearToFilter, monthToFilter, dataForAMonth);

    // Increment the index
    index++;
    monthToFilter++;
    if (monthToFilter == 13) {
      monthToFilter = 1;
      yearToFilter++;
      if (yearToFilter == 2023 && monthToFilter == 4) {
        index = 0;
        clearInterval(intervalId);
      }
    }

    if (count >= maxCount) {
      console.log("Clearing interval and resetting");
      clearInterval(intervalId);
      button.text("▶");
      intervalId = 0;
      count = 0;
      if (bubbleChart) {
        bubbleChart.remove();
      }

      renderBubbleChart(2023, 3, monthly, myIsoCodes);
      yearToFilter = 2020;
      monthToFilter = 1;
    }
  }

  // Create a function to update the colors
  function updateColors(year, month, filteredData) {
    // console.log("Data for year: " + year + "and month: " + month);

    //console.log("filteredData in updateColors");
    //console.log(filteredData);
    // Create a mapping of new_cases by iso_code

    filteredData.forEach((d) => (casesByCountry[d.iso_code] = d.new_cases));

    //console.log(casesByCountry);

    // Select all countries and update their fill colors
    d3.selectAll(".country")
      .attr("fill", function (d) {
        //console.log("Country: " + d.properties.name);
        if (typeof casesByCountry[d.id] == "undefined") return "#ffffff";
        else {
          //console.log("Cases: " + casesByCountry[d.id]);
          return colorScale(casesByCountry[d.id]);
        }
      })
      .attr("stroke", "#ffffff");
  }

  // ---------------------------------------------------------------------------------------------------
  /* Brushing section to implement brushing over the map */

  const brush = d3
    .brush()
    .extent([
      // specify the area where it is possible to brush.
      [-margin.left, -margin.top],
      [svgWidth + margin.left, svgHeight + margin.top],
    ])
    .on("end", brushed);

  d3.select(".svg-c")
    .append("g")
    .attr("class", "brush")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .call(brush);

  // callback function for the brush
  function brushed(event) {
    //console.log(myIsoCodes);
    var myIsoCodes_orig = myIsoCodes;
    myIsoCodes = myIsoCodes.filter((d) => false);
    // console.log("brushed array: ");
    // console.log(myIsoCodes);

    if (event.selection) {
      const selection = event.selection;
      var [[x0, y0], [x1, y1]] = selection;

      x0 = x0 - margin.left;
      x1 = x1 - margin.left;
      y0 = y0 - margin.top;
      y1 = y1 - margin.top;

      const selected = world.features
        .filter(function (d) {
          //console.log(d);
          //console.log(path);
          const [cx, cy] = path.centroid(d);
          return cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1;
        })
        .map(function (d) {
          console.log("selected: " + d.id);
          myIsoCodes.push(d.id);
          return d.id;
        });

      //console.log("new brushed array: ");
      //console.log(myIsoCodes);

      // update the display to show the details of only those countries
      countries.attr("fill", function (d) {
        //console.log("here: " + d.id);
        return selected.includes(d.id)
          ? colorScale(casesByCountry[d.id])
          : "gray";
      });

      if (bubbleChart) {
        bubbleChart.remove();
      }

      renderBubbleChart(yearToFilter, monthToFilter, monthly, myIsoCodes);
    } else {
      myIsoCodes = myIsoCodes_orig.filter((d) => true);
    }
  }
});

// ---------------------------------------------------------------------------------------------------
