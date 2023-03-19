/* The driving file for all the visualizations.
Tasks:
  Set up the heat map comparing:
    total deaths per million or
    new cases per million or
    both
    against GDP per capita
Functions:
  createLegend_newCases()
  createLegend_totalDeaths()
  renderHeatMap()
  fixData() - data fix ups
  toggleTooltip() - to set tooltip and turn it on and off
*/

/* Imports */

import { gdpData } from "./app.js";

const gdpMargin = { top: 10, bottom: 45, left: 40, right: 30 },
  gdpWidth = 1000 - gdpMargin.left - gdpMargin.right,
  gdpHeight = 600 - gdpMargin.top - gdpMargin.bottom,
  on = 1,
  off = 0;
var x,
  y_gen,
  deathMax,
  casesMax,
  deathMin,
  casesMin,
  minValues,
  maxValues,
  gdptooltip,
  image_tooltip,
  casesRect,
  deathsRect,
  color1,
  color2;

// Define heatmap function
export function drawHeatmap(containerId) {
  containerId = "heatmap-container";
  console.log("heatmap.js");

  // console.log("Input gdpData");
  // console.log(gdpData);

  gdptooltip = d3
    .select("#" + containerId)
    .append("div")
    .attr("class", "gdptooltip-c")
    .style("opacity", 0)
    .style("position", "absolute");

  /* fix the data */

  var gdpData_fixed = fixData(gdpData);
  // console.log("gdpData fixed");
  // console.log(gdpData_fixed);

  // Data preprocessing
  const gdpData_reduced = gdpData_fixed.filter(
    (d) =>
      d.gdp_per_capita > 100 &&
      d.total_deaths_per_million > 100 &&
      d.new_cases_per_million > 100
  );

  // console.log("gdbData_reduced");
  // console.log(gdpData_reduced);

  const gdpArray = gdpData_reduced.map((obj) => obj.gdp_per_capita);
  const totalDeathsArray = gdpData_reduced.map(
    (obj) => obj.total_deaths_per_million
  );
  const newCasesArray = gdpData_reduced.map((obj) => obj.new_cases_per_million);

  // console.log("gdpArray and totalDeathsArray");
  // console.log(gdpArray);
  // console.log(totalDeathsArray);
  // console.log(newCasesArray);

  const gdpMin = d3.min(gdpArray);
  const gdpMax = d3.max(gdpArray);
  deathMin = d3.min(totalDeathsArray);
  casesMin = d3.min(newCasesArray);
  deathMax = d3.max(totalDeathsArray);
  casesMax = d3.max(newCasesArray);

  // console.log("gdp min and max: " + gdpMin + ", " + gdpMax);
  // console.log("total deaths min and max: " + deathMin + ", " + deathMax);
  // console.log("new cases min and max: " + casesMin + ", " + casesMax);

  const gdpData_fixed1 = gdpData_reduced.map((d) => {
    return {
      gdp_per_capita: +d.gdp_per_capita,
      total_deaths_per_million: +d.total_deaths_per_million,
      new_cases_per_million: +d.new_cases_per_million,
      country: d.location,
      iso_code: d.iso_code,
    };
  });

  // console.log("gdpData_fixed1");
  // console.log(gdpData_fixed1);

  // axes and scales, color scale
  x = d3
    .scaleLinear()
    .domain([/*gdpMin / 1000*/ 0, (gdpMax + 20000) / 1000])
    .range([0, gdpWidth]);

  maxValues = [deathMax, casesMax];
  minValues = [deathMin, casesMin];
  y_gen = d3
    .scaleLog()
    .domain([d3.min(minValues) - 15, d3.max(maxValues)])
    .range([gdpHeight, 100]);

  color1 = d3
    .scaleSequential(d3.interpolateBlues)
    .domain(d3.extent(gdpData_fixed1, (d) => d.total_deaths_per_million));

  color2 = d3
    .scaleSequential(d3.interpolateReds)
    .domain(d3.extent(gdpData_fixed1, (d) => d.new_cases_per_million));

  // Chart creation
  const svglegend = d3
    .select(".heatmap-legend")
    .append("svg")
    .attr("class", "gdp-legend-c")
    .attr("width", 250)
    .attr("height", gdpHeight)
    .append("g")
    .attr("transform", `translate(${gdpMargin.left},${gdpMargin.top})`);

  /*  dropdown here indicates the selection box
        to choose parameters
    */

  const dropdown = svglegend
    .append("svg")
    .attr("class", "gdp-dropdown")
    .attr("width", 165)
    .attr("height", 90);

  dropdown
    .append("rect")
    .attr("class", "gdp-dropdown-button")
    .attr("width", 165)
    .attr("height", 90);

  dropdown
    .selectAll(".gdp-dropdown-option")
    .data(["Total deaths per million", "New cases per million", "Both"])
    .enter()
    .append("text")
    .attr("class", "gdp-dropdown-option")
    .attr("id", (d, i) => "heatmap-option" + (i + 1))
    .attr("x", 14)
    .attr("y", (d, i) => 30 + i * 20)
    .text((d) => d);

  d3.selectAll(".gdp-dropdown-option").on("click", function (event, d, i) {
    renderHeatMap(d3.select(this).attr("id"), containerId, gdpData_fixed1);
  });

  createLegend_newCases("gdp-legend-c", gdpData_fixed1);
  createLegend_totalDeaths("gdp-legend-c", gdpData_fixed1);

  const svg = d3
    .select(".heatmap-chart")
    .append("svg")
    .attr("width", gdpWidth + gdpMargin.left + gdpMargin.right)
    .attr("height", gdpHeight + gdpMargin.top + gdpMargin.bottom)
    .append("g")
    .attr("transform", `translate(${gdpMargin.left + 50},${gdpMargin.top})`)
    .attr("class", "heatmap-svg-c");

  svg
    .append("g")
    .attr("class", "heat-x-axis")
    .attr("transform", `translate(0,${gdpHeight})`)
    .call(d3.axisBottom(x));

  svg.append("g").attr("class", "heat-y-axis").call(d3.axisLeft(y_gen));

  svg
    .append("text")
    .attr("class", "x-axis-label")
    .attr("x", gdpWidth / 2)
    .attr("y", gdpHeight + 35)
    .attr("text-anchor", "middle")
    .text("GDP per capita (thousand USD)");

  svg
    .append("text")
    .attr("class", "y-axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -gdpHeight / 2)
    .attr("y", -gdpMargin.left - 10)
    .attr("text-anchor", "middle")
    .text("Total deaths / New cases (Per million)");

  /* Set up the heatmap rectangles */
  deathsRect = svg
    .selectAll(".deaths-rect")
    .data(gdpData_fixed1)
    .enter()
    .append("rect")
    .attr("class", "deaths-rect")
    .attr("id", (d) => "deaths-rect" + d.iso_code)
    .attr("x", (d) => x(d.gdp_per_capita / 1000))
    .attr("y", (d) => y_gen(d.total_deaths_per_million))
    .attr("width", x(10) - x(0))
    .attr("height", gdpHeight / 50)
    .attr("fill", (d) => color1(d.total_deaths_per_million))
    .on("mouseover", function (event, d) {
      //console.log(d);
      toggleTooltip(event, d, on);
    })
    .on("mouseleave", function (event, d) {
      toggleTooltip(event, d, off);
    });

  casesRect = svg
    .selectAll(".cases-rect")
    .data(gdpData_fixed1)
    .enter()
    .append("rect")
    .attr("class", "cases-rect")
    .attr("id", (d) => "cases-rect" + d.iso_code)
    .attr("x", (d) => x(d.gdp_per_capita / 1000))
    .attr("y", (d) => y_gen(d.new_cases_per_million))
    .attr("width", x(10) - x(0))
    .attr("height", gdpHeight / 50)
    .attr("fill", (d) => color2(d.new_cases_per_million))
    .on("mouseover", function (event, d) {
      //console.log(d);
      toggleTooltip(event, d, on);
    })
    .on("mouseout", function (event, d) {
      toggleTooltip(event, d, off);
    });
}

/* Function to render the heat map */
function renderHeatMap(what, containerId, gdpData_fixed1) {
  //console.log(what);

  const svg = d3.select("#" + containerId);
  d3.select("#" + what).style("font-weight", "bold");

  /* Controlling the updates to the objects on the screen
  based on user selection in the if..else statements
  */
  d3.select(".y-axis-label").text(function (d) {
    /* Total deaths per million */

    if (what == "heatmap-option1") {
      d3.select("#heatmap-option2").style("font-weight", "normal");
      d3.select("#heatmap-option3").style("font-weight", "normal");

      d3.selectAll(".cases-rect").remove();
      d3.select(".heatmap-cases-legend")
        .transition()
        .duration(500)
        .style("opacity", 0);
      d3.select(".heatmap-cases-ticks")
        .transition()
        .duration(500)
        .style("opacity", 0);

      d3.selectAll(".deaths-rect").remove();
      d3.select(".heatmap-deaths-legend")
        .transition()
        .duration(500)
        .style("opacity", 1);
      d3.select(".heatmap-deaths-ticks")
        .transition()
        .duration(500)
        .style("opacity", 1);

      /* General y scale for both total deaths and new cases */
      y_gen.domain([deathMin - 10, deathMax]);

      svg
        .select(".heat-y-axis")
        .transition()
        .duration(1000)
        .call(d3.axisLeft(y_gen));

      deathsRect = d3
        .select(".heatmap-svg-c")
        .selectAll(".deaths-rect")
        .data(gdpData_fixed1)
        .enter()
        .append("rect")
        .attr("class", "deaths-rect")
        .attr("id", (d) => "deaths-rect" + d.iso_code)
        .attr("x", (d) => x(d.gdp_per_capita / 1000))
        .attr("y", (d) => y_gen(d.total_deaths_per_million))
        .attr("width", x(10) - x(0))
        .attr("height", gdpHeight / 50)
        .attr("fill", (d) => color1(d.total_deaths_per_million))
        .on("mouseover", function (event, d) {
          toggleTooltip(event, d, on);
        })
        .on("mouseout", function (event, d) {
          toggleTooltip(event, d, off);
        });
      return "Total deaths per million";
    } else if (what == "heatmap-option2") {
      /* New cases per million */
      d3.select("#heatmap-option1").style("font-weight", "normal");
      d3.select("#heatmap-option3").style("font-weight", "normal");

      d3.selectAll(".deaths-rect").remove();
      d3.select(".heatmap-deaths-legend")
        .transition()
        .duration(500)
        .style("opacity", 0);
      d3.select(".heatmap-deaths-ticks")
        .transition()
        .duration(500)
        .style("opacity", 0);

      d3.selectAll(".cases-rect").remove();
      d3.select(".heatmap-cases-legend")
        .transition()
        .duration(500)
        .style("opacity", 1);
      d3.select(".heatmap-cases-ticks")
        .transition()
        .duration(500)
        .style("opacity", 1);

      y_gen.domain([casesMin - 30, casesMax]);

      svg
        .select(".heat-y-axis")
        .transition()
        .duration(1000)
        .call(d3.axisLeft(y_gen));

      casesRect = d3
        .select(".heatmap-svg-c")
        .selectAll(".cases-rect")
        .data(gdpData_fixed1)
        .enter()
        .append("rect")
        .attr("class", "cases-rect")
        .attr("id", (d) => "cases-rect" + d.iso_code)
        .attr("x", (d) => x(d.gdp_per_capita / 1000))
        .attr("y", (d) => y_gen(d.new_cases_per_million))
        .attr("width", x(10) - x(0))
        .attr("height", gdpHeight / 50)
        .attr("fill", (d) => color2(d.new_cases_per_million))
        .on("mouseover", function (event, d) {
          toggleTooltip(event, d, on);
        })
        .on("mouseout", function (event, d) {
          toggleTooltip(event, d, off);
        });

      return "New cases per million";
    } else {
      /* BOTH */

      d3.select("#heatmap-option2").style("font-weight", "normal");
      d3.select("#heatmap-option1").style("font-weight", "normal");

      d3.selectAll(".cases-rect").remove();
      d3.select(".heatmap-cases-legend")
        .transition()
        .duration(500)
        .style("opacity", 1);
      d3.select(".heatmap-cases-ticks")
        .transition()
        .duration(500)
        .style("opacity", 1);

      d3.selectAll(".deaths-rect").remove();
      d3.select(".heatmap-deaths-legend")
        .transition()
        .duration(500)
        .style("opacity", 1);
      d3.select(".heatmap-deaths-ticks")
        .transition()
        .duration(500)
        .style("opacity", 1);

      y_gen.domain([d3.min(minValues) - 15, d3.max(maxValues)]);

      svg
        .select(".heat-y-axis")
        .transition()
        .duration(1000)
        .call(d3.axisLeft(y_gen));

      deathsRect = d3
        .select(".heatmap-svg-c")
        .selectAll(".deaths-rect")
        .data(gdpData_fixed1)
        .enter()
        .append("rect")
        .attr("class", "deaths-rect")
        .attr("id", (d) => "deaths-rect" + d.iso_code)
        .attr("x", (d) => x(d.gdp_per_capita / 1000))
        .attr("y", (d) => y_gen(d.total_deaths_per_million))
        .attr("width", x(10) - x(0))
        .attr("height", gdpHeight / 50)
        .attr("fill", (d) => color1(d.total_deaths_per_million))
        .on("mouseover", function (event, d) {
          //console.log(d);
          toggleTooltip(event, d, on);
        })
        .on("mouseleave", function (event, d) {
          toggleTooltip(event, d, off);
        });

      casesRect = d3
        .select(".heatmap-svg-c")
        .selectAll(".cases-rect")
        .data(gdpData_fixed1)
        .enter()
        .append("rect")
        .attr("class", "cases-rect")
        .attr("id", (d) => "cases-rect" + d.iso_code)
        .attr("x", (d) => x(d.gdp_per_capita / 1000))
        .attr("y", (d) => y_gen(d.new_cases_per_million))
        .attr("width", x(10) - x(0))
        .attr("height", gdpHeight / 50)
        .attr("fill", (d) => color2(d.new_cases_per_million))
        .on("mouseover", function (event, d) {
          //console.log(d);
          toggleTooltip(event, d, on);
        })
        .on("mouseout", function (event, d) {
          toggleTooltip(event, d, off);
        });

      return "Total deaths / New cases (Per million)";
    }
  });

  d3.select("#deaths-rectQAT")
    .attr("stroke", "green")
    .attr("stroke-width", "3px");
  d3.select("#cases-rectQAT")
    .attr("stroke", "green")
    .attr("stroke-width", "3px");
  d3.select("#deaths-rectCOM")
    .attr("stroke", "red")
    .attr("stroke-width", "3px");
  d3.select("#cases-rectCOM").attr("stroke", "red").attr("stroke-width", "3px");
}

export function fixData(data) {
  data.forEach(function (d) {
    d.year = +d.year;
    d.month = +d.month;
    d.total_vaccinations = isNaN(parseFloat(+d.total_vaccinations))
      ? 0
      : parseFloat(+d.total_vaccinations);
    d.population = isNaN(parseFloat(+d.population))
      ? 0
      : parseFloat(d.population);
    d.gdp_per_capita = isNaN(parseFloat(+d.gdp_per_capita))
      ? 10
      : parseFloat(+d.gdp_per_capita);

    d.vacc_rate = isNaN(parseFloat(+d.vacc_rate))
      ? 0
      : parseFloat(+d.vacc_rate);
    d.new_deaths = isNaN(parseFloat(+d.new_deaths))
      ? 0
      : parseFloat(+d.new_deaths);
    d.total_deaths_per_million = isNaN(parseFloat(+d.total_deaths_per_million))
      ? 0
      : parseFloat(+d.total_deaths_per_million);
    d.total_deaths = isNaN(parseFloat(+d.total_deaths))
      ? 0
      : parseFloat(+d.total_deaths);
    d.new_cases = isNaN(parseFloat(+d.new_cases))
      ? 0
      : parseFloat(+d.new_cases);
    d.new_cases_per_million = isNaN(parseFloat(+d.new_cases_per_million))
      ? 0
      : parseFloat(+d.new_cases_per_million);
    d.total_cases = isNaN(parseFloat(+d.total_cases))
      ? 0
      : parseFloat(+d.total_cases);
    d.death_rate = d.new_cases == 0 ? 0 : (d.new_deaths / d.new_cases) * 100;
    d.death_rate1 =
      d.new_cases_per_million == 0
        ? 10
        : (d.total_deaths_per_million / d.new_cases_per_million) * 100;
    if (isNaN(+d.death_rate) || isNaN(+d.vacc_rate)) {
      console.log("Something WRONG!!!!!");
      console.log(d);
    }
    if (isNaN(+d.death_rate1) || isNaN(+d.vacc_rate)) {
      console.log("Something WRONG!!!!!");
      console.log(d);
    }
  });
  return data;
}

function createLegend_totalDeaths(containerClass, data) {
  const margin = { top: 150, right: 0, bottom: 10, left: 50 },
    width = 30,
    height = 200;

  const svg = d3.select(`.${containerClass}`);

  const defs = svg.append("defs");

  const gradient = defs
    .append("linearGradient")
    .attr("id", "gradient")
    .attr("gradientTransform", "rotate(90)");

  gradient
    .selectAll("stop")
    .data(
      d3
        .ticks(
          0,
          d3.max(data, (d) => d.total_deaths_per_million),
          10
        )
        .map((t, i, n) => ({
          offset: `${((100 * i) / n.length).toFixed(1)}%`,
          color: d3.interpolateBlues(
            1 - t / d3.max(data, (d) => d.total_deaths_per_million)
          ),
        }))
    )
    .join("stop")
    .attr("offset", (d) => d.offset)
    .attr("stop-color", (d) => d.color);

  svg
    .append("rect")
    .attr("class", "heatmap-deaths-legend")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "url(#gradient)")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.total_deaths_per_million)])
    .range([height, 0]);

  const yAxis = d3.axisRight(y).ticks(5);

  svg
    .append("g")
    .attr("transform", `translate(${width + margin.left},${margin.top})`)
    .attr("class", "heatmap-deaths-ticks")
    .call(yAxis);
}

function createLegend_newCases(containerClass, data) {
  const margin = { top: 150, right: 0, bottom: 10, left: 140 },
    width = 30,
    height = 200;

  const svg = d3.select(`.${containerClass}`);

  const defs1 = svg.append("defs").attr("class", "defs").attr("id", "defs-1");

  const gradient1 = defs1
    .append("linearGradient")
    .attr("id", "gradient-1")
    .attr("gradientTransform", "rotate(90)");

  gradient1
    .selectAll("stop")
    .data(
      d3
        .ticks(
          0,
          d3.max(data, (d) => d.new_cases_per_million),
          10
        )
        .map((t, i, n) => ({
          offset: `${((100 * i) / n.length).toFixed(1)}%`,
          color: d3.interpolateReds(
            1 - t / d3.max(data, (d) => d.new_cases_per_million)
          ),
        }))
    )
    .join("stop")
    .attr("offset", (d) => d.offset)
    .attr("stop-color", (d) => d.color);

  svg
    .append("rect")
    .attr("class", "heatmap-cases-legend")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "url(#gradient-1)")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const y1 = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.new_cases_per_million)])
    .range([height, 0]);

  const yAxis1 = d3.axisRight(y1).ticks(5);

  svg
    .append("g")
    .attr("class", "heatmap-cases-ticks")
    .attr("transform", `translate(${width + margin.left},${margin.top})`)
    .call(yAxis1);
}

function toggleTooltip(event, d, on_off) {
  if (on_off) {
    gdptooltip
      .html("<div class=tooltip>" + d.country + "</div>")
      .style("left", event.pageX + 2 + "px")
      .style("top", event.pageY + 2 + "px")
      .style("position", "absolute")
      .style("padding", "0 5px") // This means 0px at the top and bottom
      // and 10 on the left and right
      .style("background", "white")
      .style("border-radius", "10px")
      .transition()
      .duration(100)
      .style("opacity", 1);
  } else {
    gdptooltip.style("opacity", 0);
  }
}
