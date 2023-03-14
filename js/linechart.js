const lineMargin = { top: 5, bottom: 45, left: 0, right: 30 },
  lineWidth = 1250 - lineMargin.left - lineMargin.right,
  lineHeight = 290 - lineMargin.top - lineMargin.bottom;

var dropdown,
  linexScale,
  lineyScale,
  deathLine,
  vaccinationLine,
  lineSvg,
  dataMap_g;

//Define drawLine function
export function drawLineChart(containerId) {
  const lineGroup = d3.select("#" + containerId);

  const container = lineGroup.append("div").attr("class", "dropdown-container");

  lineSvg = lineGroup
    .append("svg")
    .attr("class", "line-svg-c")
    .attr("width", lineWidth + lineMargin.left + lineMargin.right)
    .attr("height", lineHeight + lineMargin.top + lineMargin.bottom)
    .append("g")
    .attr(
      "transform",
      "translate(" + lineMargin.left + 230 + "," + lineMargin.top + ")"
    );
}

export function renderLineChart(dataMap, svgHeight) {
  dataMap_g = dataMap;
  const container = d3.select(".dropdown-container");

  // Create an array of country names for the dropdown menu
  var location_fromDataMap = Array.from(dataMap.keys());
  //console.log(location_fromDataMap);

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
    .attr("width", 125)
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
    .text("Death Rate")
    .style("font-size", "15px")
    .attr("alignment-baseline", "middle");

  lineLegLabelSvg
    .append("text")
    .attr("class", "line-leglabel-vacc-rate")
    .attr("x", 15)
    .attr("y", 35)
    .text("Vaccination Rate")
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

  dropdown.on("change", updateLineChart);
}

// Define a function to update the chart
export function updateLineChart() {
  console.log("In updateLineChart function:");
  var country = dropdown.property("value");
  var countryData = dataMap_g.get(country);
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
    d.new_deaths_per_million = isNaN(parseFloat(+d.new_deaths_per_million))
      ? 0
      : parseFloat(+d.new_deaths_per_million);
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
        ? 0
        : (d.new_deaths_per_million / d.new_cases_per_million) * 100;
    if (isNaN(+d.death_rate) || isNaN(+d.vacc_rate)) {
      console.log("Something WRONG!!!!!");
      console.log(d);
    }
    if (isNaN(+d.death_rate1) || isNaN(+d.vacc_rate)) {
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
      return d3.max([(d.death_rate1, d.vacc_rate)]);
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

  const curvetype = d3.curveCatmullRom;

  // Define line functions for death and vaccination rates
  const deathLineFunction = d3
    .line() //.area()
    .x(function (d) {
      var xdate = new Date(d.year, d.month - 1);
      //console.log(xdate);
      return linexScale(xdate);
    })
    //.y0(lineHeight)
    .y(function (d) {
      return lineyScale(d.death_rate1 === 0 ? 0.0001 : d.death_rate1);
    })
    .curve(curvetype);

  const vaccinationLineFunction = d3
    .line() //.area()
    .x(function (d) {
      return linexScale(new Date(d.year, d.month - 1));
    })
    //.y0(lineHeight)
    .y(function (d) {
      return lineyScale(d.vacc_rate === 0 ? 0.0001 : d.vacc_rate);
    })
    .curve(curvetype);

  // Update death line with data
  deathLine.datum(countryData).attr("d", deathLineFunction);

  // Update vaccination line with data
  vaccinationLine.datum(countryData).attr("d", vaccinationLineFunction);
}
