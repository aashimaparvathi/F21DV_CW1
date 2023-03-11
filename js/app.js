// Define the dimensions and margins of the plot
var margin = { top: 80, right: 30, bottom: 30, left: 5 },
  bubbleMargin = { top: 20, bottom: 50, left: 50, right: 30 },
  lineMargin = { top: 5, bottom: 45, left: 0, right: 30 },
  svgWidth = 800 - margin.left - margin.right,
  svgHeight = 500 - margin.top - margin.bottom,
  bubbleWidth = 450 - bubbleMargin.left - bubbleMargin.right,
  bubbleHeight = 500 - bubbleMargin.top - bubbleMargin.bottom,
  lineWidth = 1250 - lineMargin.left - lineMargin.right,
  lineHeight = 290 - lineMargin.top - lineMargin.bottom,
  bubbleChart,
  bubbleX,
  bubbleXValues,
  bubbleXTicks,
  bubbleY,
  bubbleYValues,
  bubbleYTicks,
  bubbleTickFormatter,
  bubbleR,
  bubbleColor,
  variableBubbleColor,
  readyForBubble = 0,
  bubbleID,
  bubbleIsoCode,
  countryColor,
  dropdown,
  linexScale,
  lineyScale,
  deathLine,
  vaccinationLine,
  firstTime = 0,
  wave1year = 2020,
  wave1month = 3,
  wave2year = 2020,
  wave2month = 9,
  wave3year = 2021,
  wave3month = 5;
const intervalDelay = 1000; // change intervalDelay back to 1000 later
// Create a mapping object to store iso_code -> country_name mapping
const isoToCountry = {};

const tooltip = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip-c")
  .style("opacity", 0)
  .style("position", "absolute");

const bubbletooltip = d3
  .select("body")
  .append("div")
  .attr("class", "bubbletooltip-c")
  .style("opacity", 0)
  .style("position", "absolute");

// const border = d3
//   .select("body")
//   .append("div")
//   .attr("class", "border-c")
//   .attr("id", "border")
//   .style("opacity", 0)
//   .style("position", "absolute");

// create a div to hold the location or flag image
let locationImage = d3
  .select("body")
  .append("div")
  .attr("class", "location-image")
  .style("position", "absolute")
  .style("pointer-events", "none")
  .style("opacity", 0);

var myCountries = [
  { location: "USA", iso_code: "USA" },
  { location: "China", iso_code: "CHN" },
  { location: "Australia", iso_code: "AUS" },
  { location: "Guyana", iso_code: "GUY" },
  { location: "Central African Republic", iso_code: "CAF" },
];

var myIsoCodes = ["USA", "CHN", "AUS", "GUY", "CAF"];

const group = d3
  .select("body")
  .append("div")
  .style("position", "relative")
  .style("width", svgWidth + 50 + "px")
  .style("height", 20 + "px")
  .style("display", "inline-block");

var svg = group
  .append("svg")
  .attr("class", "svg-c")
  .attr("width", svgWidth + margin.left + margin.right)
  .attr("height", svgHeight + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// group
//   .append("div")
//   .attr("id", "info-container")
//   .style("width", svgWidth / 2 + "px")
//   .style("height", "20px")
//   .style("display", "inline-block");

group
  .append("g")
  .attr("id", "play-c")
  .attr("transform", "translate(0, " + (svgHeight - 60) + ")")
  .append("button")
  .attr("id", "play-button")
  .attr("class", "play-c")
  .text("▶");

var nextgroup = d3
  .select("body")
  .append("g")
  .attr("class", "bubblegroup-c")
  .attr("id", "bubblegroup");

const bubbleSvg = nextgroup
  .append("svg")
  .attr("width", bubbleWidth + bubbleMargin.left + bubbleMargin.right)
  .attr("height", bubbleHeight + bubbleMargin.top + bubbleMargin.bottom);

var lineGroup = d3
  .select("body")
  .append("g")
  .attr("class", "linegroup-c")
  .attr("id", "linegroup");

const container = lineGroup.append("div").attr("class", "dropdown-container");

var lineSvg = lineGroup
  .append("svg")
  .attr("width", lineWidth + lineMargin.left + lineMargin.right)
  .attr("height", lineHeight + lineMargin.top + lineMargin.bottom)
  .append("g")
  .attr(
    "transform",
    "translate(" + lineMargin.left + 230 + "," + lineMargin.top + ")"
  );

//d3.select(".play-c").style("margin-left", svgWidth / 2 + "px");

// Create projection to map the latitudes and longitudes to x and y
const projection = d3
  .geoMercator()
  .rotate([-10, 0]) // Adjust the rotation of the projection
  .translate([svgWidth / 2, svgHeight / 2]) // To centre it. Later we'll scale it.
  .scale(120);

// Create path using the projection. Pass it to the d attribute of path
const path = d3.geoPath().projection(projection);

const formatNumber = d3.format(".2s");
const formatTime = d3.timeFormat("%B, %Y");

var dataForAMonth_g = {}; // global variable

function filterData(month, year, data) {
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
  // https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson
  d3.json("./data/map/world.geojson"),
  d3.csv("./data/montly_per_continent.csv"),
  d3.csv("./data/monthly_all.csv"),
]).then(function ([world, monthly_per_continent, monthly]) {
  console.log("world: ");
  console.log(world);
  console.log("monthly_per_continent: ");
  console.log(monthly_per_continent);
  console.log("monthly: ");
  console.log(monthly);

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

  var yearToFilter = 2020;
  var monthToFilter = 1;

  let intervalId = null;
  let index = 0;
  var count = 0;
  const maxCount = 39,
    casesByCountry = {};
  var periodItem = svg;

  const colorScale = d3
    .scaleThreshold()
    .range(["#fee5d9", "#fcbba1", "#fc9272", "#fb6a4a", "#de2d26"])
    //.range(["#e5b2b1", "#f26c6c", "#c94d4d", "#b43d3d", "#a93434"])
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
    .style("font-family", "serif");

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
    .attr("stroke", "#666666")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var locationimage = countries
    .append("image")
    .attr("class", "location-image")
    .attr("id", (d) => d.iso_code + "img")
    .attr("xlink:href", "./images/icon.png")
    .attr("width", 20)
    .attr("height", 20)
    .attr("opacity", 0);

  // Create a map of country names to data for that country
  var dataMap = d3.group(monthly, function (d) {
    return d.location;
  });

  console.log("DataMap:");
  console.log(dataMap);
  renderLineChart(dataMap);

  // Set up the play button
  const button = d3.select("#play-button");

  countries
    .on("mouseover", function (event, d) {
      //console.log(d);
      var countryCode = d3.select(this).attr("class");
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
  button.on("click", function () {
    index = 0;
    if (intervalId) {
      console.log("PAUSED");
      // If the interval is already running, stop it
      clearInterval(intervalId);
      intervalId = null;
      button.text("▶");
      if (firstTime >= 1) {
        bubbleChart.remove();
      }
      if (monthToFilter == 1) {
        monthToFilter = 12;
        yearToFilter--;
      } else {
        monthToFilter--;
      }

      renderBubble(yearToFilter, monthToFilter);
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
    dataForAMonth = monthly.filter(
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
      readyForBubble = 1;
      bubbleChart.remove();
      renderBubble(2023, 3);
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

  function renderLineChart(dataMap) {
    // Create an array of country names for the dropdown menu
    var location_fromDataMap = Array.from(dataMap.keys());
    console.log(location_fromDataMap);

    dropdown = container
      .append("select")
      .attr("class", "dropdown-c")
      .attr("id", "dropdownmenu")
      .style("position", "relative")
      .style("top", "19.5px") // adjust the top position as needed
      .style("left", "15px") // adjust the left position as needed
      .style("width", "160px")
      .style("height", "50px")
      .style("padding", "10px");

    // Legend
    const lineLegend = container
      .append("g")
      .attr("class", "linelegend-c")
      .style("position", "absolute")
      .style("top", svgHeight + lineHeight / 2 + 100 + "px") // adjust the top position as needed
      .style("left", "15px") // adjust the left position as needed
      .style("width", "220px")
      .style("height", "120px")
      .style("padding", "10px");
    //.attr("transform", `translate(${lineWidth - 100},${lineHeight - 100})`);

    const lineColor = {
      death_rate: "#ad001ac7",
      vaccination_rate: "#029ac1c7",
    };

    // add a rectangle for the death rate line
    const lineLegendSvg = lineLegend
      .append("svg")
      .attr("class", "line-legend-svg")
      .attr("width", 22)
      .attr("height", 50);

    const lineLegLabelSvg = lineLegend
      .append("svg")
      .attr("class", "line-legend-svg")
      .attr("width", 120)
      .attr("height", 50);

    lineLegendSvg
      .append("rect")
      .attr("class", "line-leg-death-rate")
      .attr("x", 1)
      .attr("y", 1)
      .attr("width", 20)
      .attr("height", 20)
      .attr("rx", 5)
      .attr("fill", lineColor.death_rate);

    // add a rectangle for the vaccination rate line
    lineLegendSvg
      .append("rect")
      .attr("class", "line-leg-vacc-rate")
      .attr("x", 1)
      .attr("y", 23)
      .attr("width", 20)
      .attr("height", 20)
      .attr("rx", 5)
      .attr("fill", lineColor.vaccination_rate);

    // add text labels for the lines
    lineLegLabelSvg
      .append("text")
      .attr("class", "line-leglabel-death-rate")
      .attr("x", 15)
      .attr("y", 12)
      .text("Death rate")
      .style("font-size", "15px")
      .attr("alignment-baseline", "middle");

    lineLegLabelSvg
      .append("text")
      .attr("class", "line-leglabel-vacc-rate")
      .attr("x", 15)
      .attr("y", 35)
      .text("Vaccination rate")
      .style("font-size", "15px")
      .attr("alignment-baseline", "middle");

    dropdown
      .selectAll("option")
      .data(dataMap)
      .enter()
      .append("option")
      .text(function (d, i) {
        //console.log(Array.from(d)[0]);
        return Array.from(d)[0];
      })
      .attr("value", function (d) {
        //console.log(Array.from(d)[1]);
        return Array.from(d)[0];
      });

    // Create scales for the x and y axes
    linexScale = d3
      .scaleTime()
      .domain([new Date(2020, 1), new Date(2021, 2)])
      .range([0, lineWidth - 230]);

    lineyScale = d3.scaleLog().domain([0.0001, 100]).range([lineHeight, 0]);

    // Add death line to line chart
    deathLine = lineSvg.append("path").attr("class", "death-line");

    // Add vaccination line to line chart
    vaccinationLine = lineSvg.append("path").attr("class", "vaccination-line");

    const xAxis = d3.axisBottom(linexScale);
    const yAxis = d3.axisLeft(lineyScale);

    // Add the x and y axes
    lineSvg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", "translate(0," + lineHeight + ")")
      .call(
        xAxis.tickFormat(d3.timeFormat("%b, %y")).ticks(d3.timeMonth.every(1))
      );

    lineSvg
      .append("g")
      .attr("class", "y-axis")
      .call(yAxis.ticks(6).tickFormat(d3.format(".0%")));

    // Add labels for the axes
    lineSvg
      .append("text")
      .attr("class", "y-axis-text")
      .attr("text-anchor", "left")
      .attr(
        "transform",
        "translate(" +
          lineWidth / 2.5 +
          "," +
          (lineHeight + lineMargin.bottom / 2 + 15 + ")")
      )
      .text("Time");

    lineSvg
      .append("text")
      .attr("class", "x-axis-text")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - lineMargin.left)
      .attr("x", 0 - lineHeight / 2)
      .attr("dy", "1em")
      .text("Rate (%)");

    dropdown.on("change", updateChart);
  }

  // Define a function to update the chart
  function updateChart() {
    console.log("In updateChart function:");
    var country = dropdown.property("value");
    var countryData = dataMap.get(country);
    console.log(country);
    console.log(countryData);

    countryData.forEach(function (d) {
      d.year = +d.year;
      d.month = +d.month;
      d.total_vaccinations = isNaN(parseFloat(+d.total_vaccinations))
        ? 0
        : parseFloat(+d.total_vaccinations);
      d.population = isNaN(parseFloat(+d.population))
        ? 0
        : parseFloat(d.population);
      d.vacc_rate = isNaN(parseFloat(+d.vacc_rate))
        ? 0
        : parseFloat(+d.vacc_rate);
      d.new_deaths = isNaN(parseFloat(+d.new_deaths))
        ? 0
        : parseFloat(+d.new_deaths);
      d.total_deaths = isNaN(parseFloat(+d.total_deaths))
        ? 0
        : parseFloat(+d.total_deaths);
      d.new_cases = isNaN(parseFloat(+d.new_cases))
        ? 0
        : parseFloat(+d.new_cases);
      d.total_cases = isNaN(parseFloat(+d.total_cases))
        ? 0
        : parseFloat(+d.total_cases);
      d.death_rate = d.new_cases == 0 ? 0 : (d.new_deaths / d.new_cases) * 100;
      if (isNaN(+d.death_rate) || isNaN(+d.vacc_rate)) {
        console.log("Something WRONG!!!!!");
        console.log(d);
      }
    });

    // Update the x scale domain
    linexScale.domain(
      d3.extent(countryData, function (d) {
        return new Date(d.year, d.month - 1);
      })
    );

    // Update the y scale domain
    lineyScale.domain([
      0.0001,
      d3.max(countryData, function (d) {
        return d3.max([(d.death_rate, d.vacc_rate)]);
      }),
    ]);

    // Update the x axis
    lineSvg
      .select(".x-axis")
      .transition()
      .duration(1000)
      .call(
        d3
          .axisBottom(linexScale)
          .tickFormat(d3.timeFormat("%b, %y"))
          .ticks(d3.timeMonth.every(2))
      );

    // Update the y axis
    lineSvg
      .select(".y-axis")
      .transition()
      .duration(1000)
      .call(d3.axisLeft(lineyScale).ticks(5).tickFormat(d3.format(".0%")));

    // Define line functions for death and vaccination rates
    const deathLineFunction = d3
      .line() //.area()
      .x(function (d) {
        var xdate = new Date(d.year, d.month - 1);
        console.log(xdate);
        return linexScale(xdate);
      })
      //.y0(lineHeight)
      .y(function (d) {
        return lineyScale(d.death_rate === 0 ? 0.0001 : d.death_rate);
      })
      .curve(d3.curveMonotoneX);

    const vaccinationLineFunction = d3
      .line() //.area()
      .x(function (d) {
        return linexScale(new Date(d.year, d.month - 1));
      })
      //.y0(lineHeight)
      .y(function (d) {
        return lineyScale(d.vacc_rate === 0 ? 0.0001 : d.vacc_rate);
      })
      .curve(d3.curveMonotoneX);

    // Update death line with data
    deathLine.datum(countryData).attr("d", deathLineFunction);

    // Update vaccination line with data
    vaccinationLine.datum(countryData).attr("d", vaccinationLineFunction);
  }

  // ---------------------------------------------------------------------------------------------------

  function renderBubble(year, month) {
    console.log("month and year in renderBubble: " + month + "," + year);

    dataForAMonth_b = filterData(month, year, monthly);

    var myDataForAMonth_b = dataForAMonth_b.filter(function (d) {
      //console.log(d.iso_code);
      return myIsoCodes.includes(d.iso_code);
    });

    console.log(myDataForAMonth_b);

    bubbleX = d3
      .scaleLinear()
      .domain([
        0,
        //d3.min(myDataForAMonth_b, (d) => d.stringency_index),
        d3.max(myDataForAMonth_b, (d) => d.stringency_index) * 1.5,
      ])
      .range([0, bubbleWidth]);

    bubbleY = d3
      .scaleLog()
      .domain([
        d3.min(myDataForAMonth_b, (d) => {
          return d.total_cases > 0 ? d.total_cases : 0.1;
        }),
        d3.max(myDataForAMonth_b, (d) => d.total_cases) * 10,
      ])
      .range([bubbleHeight, 0]);

    // Create a tick formatter function that formats the ticks uniformly
    bubbleTickFormatter = bubbleY.tickFormat(10, "~s");

    bubbleR = d3
      .scaleLinear()
      .domain([0, d3.max(myDataForAMonth_b, (d) => d.population_density)])
      .range([20, 60]);

    /* For reference: ["USA", "CHN", "AUS", "GUY", "CAF"]; */
    bubbleColor = d3
      .scaleOrdinal()
      .domain(myIsoCodes)
      .range(d3.schemeCategory10);
    //      .range(["#1f77b4", "#ff7f0e", "#2ca02c", "#42ecff", "#9467bd"]);

    function countryColor(iso_code) {
      return iso_code === "USA" ||
        iso_code === "CHN" ||
        iso_code === "AUS" ||
        iso_code === "GUY" ||
        iso_code === "CAF"
        ? bubbleColor(iso_code)
        : "#7f7f7f";
    }

    bubbleChart = bubbleSvg
      .append("g")
      .attr(
        "transform",
        "translate(" + bubbleMargin.left + "," + bubbleMargin.top + ")"
      );

    bubbleSvg
      .append("text")
      .attr("x", bubbleWidth / 2 + bubbleMargin.left + 20)
      .attr("y", bubbleMargin.top + 10 / 2)
      .attr("text-anchor", "middle")
      .attr("class", "bubble-title-c")
      .attr("id", "covid-response")
      .text("Impact of Stringency Measures");

    bubbleChart
      .selectAll("circle")
      .data(myDataForAMonth_b)
      .join("circle")
      .attr("id", (d) => d.iso_code + "-bubble")
      .attr("class", "countrybubbles")
      .attr("cx", (d) => bubbleX(d.stringency_index))
      .attr("cy", (d) =>
        d.total_cases == 0 ? bubbleY(0.1) : bubbleY(d.total_cases)
      )
      .transition()
      .duration(500)
      .delay((d, i) => i * 100)
      .attr("r", (d) => bubbleR(d.population_density))
      .attr("stroke", (d) => bubbleColor(d.iso_code))
      .attr("fill", (d) => bubbleColor(d.iso_code))
      .attr("fill-opacity", "0.1")
      .attr("stroke-opacity", "0.9");

    const xAxis = d3.axisBottom(bubbleX);
    const yAxis = d3.axisLeft(bubbleY).tickFormat(bubbleTickFormatter);

    bubbleChart
      .append("g")
      .attr("transform", `translate(0, ${bubbleHeight})`)
      .call(xAxis);

    bubbleChart.append("g").call(yAxis);

    bubbleChart
      .append("text")
      .attr("x", bubbleWidth / 2)
      .attr("y", bubbleHeight + bubbleMargin.top + bubbleMargin.bottom / 2 - 2)
      .attr("text-anchor", "middle")
      .attr("class", "bubble-xaxis-c")
      .attr("id", "stringency-index")
      .text("Stringency Index");

    bubbleChart
      .append("text")
      .attr("x", -bubbleHeight / 2)
      .attr("y", -bubbleMargin.left + 10)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .attr("class", "bubble-yaxis-c")
      .attr("id", "total-cases")
      .text("Total Cases");

    d3.selectAll(".countrybubbles")
      .on("mouseover", function (event, d) {
        (bubbleID = d3.select(this).attr("id")), (bubbleIsoCode = d.iso_code);
        console.log(bubbleID + ", " + bubbleIsoCode);
        d3.select(this).style("opacity", 0.7);
        bubbletooltip
          .html(
            "<div class=bubbletooltip-text>" +
              d.location +
              "<br> Cases: " +
              (typeof d.total_cases == "undefined"
                ? 0
                : d.total_cases.toFixed(0)) +
              "<br> Population Density: " +
              d.population_density +
              "</div>"
          )
          .style("left", event.pageX + 2 + "px")
          .style("top", event.pageY + 2 + "px")
          .style("position", "absolute")
          .style("padding", "0 5px") // This means 0px at the top and bottom
          // and 10 on the left and right
          .style("background-color", "white")
          .style("border-color", function (d) {
            var color = d3.color(bubbleColor(bubbleIsoCode));
            color.opacity = 0.5;
            return color.toString();
          })
          .style("border-style", "solid")
          .style("border-width", "1px")
          .style("border-radius", "10px")
          .transition()
          .duration(100)
          .style("opacity", 1);

        countryColor = d3.select("#" + bubbleIsoCode).attr("fill");

        d3.select("#" + bubbleIsoCode)
          .classed("country-highlight", true)
          .attr("stroke", bubbleColor(bubbleIsoCode))
          .attr("fill", bubbleColor(bubbleIsoCode));
      })
      .on("mouseout", function (event, d) {
        d3.select(this).style("opacity", 1);
        bubbletooltip.transition().duration(0).style("opacity", 0);

        d3.select("#" + bubbleIsoCode)
          .classed("country-highlight", false)
          .attr("stroke", "none")
          .attr("fill", countryColor);

        // locationImage.style("opacity", 0);
      })
      .on("click", function () {
        // get the dropdown element
        const dropdown = d3.select("#dropdownmenu");
        const value = isoToCountry[bubbleIsoCode];
        console.log("Country value: " + value);

        // set the value of the dropdown to a specific country
        dropdown.property("value", value);

        // call the updateChart function with the new dropdown value
        updateChart(dropdown.property("value"));
      });

    firstTime++;
  }

  // ---------------------------------------------------------------------------------------------------

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
    console.log(myIsoCodes);
    myIsoCodes_orig = myIsoCodes;
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

      console.log("new brushed array: ");
      console.log(myIsoCodes);

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
      renderBubble(yearToFilter, monthToFilter);
    } else {
      myIsoCodes = myIsoCodes_orig.filter((d) => true);
    }
  }
});

// ---------------------------------------------------------------------------------------------------
