// Define the dimensions and margins of the plot
var margin = { top: 80, right: 30, bottom: 30, left: 5 },
  bubbleMargin = { top: 20, bottom: 50, left: 50, right: 30 },
  svgWidth = 800 - margin.left - margin.right,
  svgHeight = 500 - margin.top - margin.bottom,
  bubbleWidth = 450 - bubbleMargin.left - bubbleMargin.right,
  bubbleHeight = 500 - bubbleMargin.top - bubbleMargin.bottom,
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
  firstTime = 0,
  wave1year = 2020,
  wave1month = 3,
  wave2year = 2020,
  wave2month = 9,
  wave3year = 2021,
  wave3month = 5;
const intervalDelay = 1000; // change intervalDelay back to 1000 later

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

var svg = d3
  .select("body")
  .append("svg")
  .attr("class", "svg-c")
  .attr("width", svgWidth + margin.left + margin.right)
  .attr("height", svgHeight + margin.top + margin.bottom)
  //.style('background-color', '#eeeeee')
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

const bubbleSvg = d3
  .select("body")
  .append("svg")
  .attr("width", bubbleWidth + bubbleMargin.left + bubbleMargin.right)
  .attr("height", bubbleHeight + bubbleMargin.top + bubbleMargin.bottom);

d3.select(".play-c").style("margin-left", svgWidth / 2 + "px");

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
    .attr("transform", "translate(20, " + (svgHeight - 50) + ")");

  periodItem = period
    .append("g")
    .attr("class", "period-item")
    .attr("transform", "translate(0, 0)")
    .append("text")
    .attr("x", 0)
    .attr("y", 15)
    .attr("width", 20)
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
    .attr("transform", (d, i) => `translate(0, ${i * 25})`);

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
      .attr("stroke-opacity", "0.7");

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

        //d3.select("#" + bubbleIsoCode + "img").style("opacity", 1);

        // // get the bounding box of the country on the map
        // let node = d3.select("#" + bubbleIsoCode).node();
        // let bbox = node.getBBox();
        // let transform = node.getAttribute("transform");
        // if (transform) {
        //   let transformValues = transform.match(/[-.\d]+/g).map(Number);
        //   bbox.x += transformValues[0];
        //   bbox.x -= margin.left;
        //   bbox.y += transformValues[1];
        //   bbox.y -= margin.top;
        // }

        // //set the location image src and alt attributes based on the location or flag data
        // locationImage
        //   .html(`<img src="./images/icon.png" alt="${d.location}"/>`)
        //   .style("left", bbox.x + bbox.width - margin.left / 2 + "px")
        //   .style("top", bbox.y + bbox.height + margin.top / 2 + "px")
        //   .style("opacity", 1);
      })
      .on("mouseout", function (event, d) {
        d3.select(this).style("opacity", 1);
        bubbletooltip.transition().duration(0).style("opacity", 0);

        d3.select("#" + bubbleIsoCode)
          .classed("country-highlight", false)
          .attr("stroke", "none")
          .attr("fill", countryColor);

        // locationImage.style("opacity", 0);
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
