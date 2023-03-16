const lineMargin = { top: 20, bottom: 40, left: 0, right: 45 },
  lineWidth = 1000 - lineMargin.left - lineMargin.right,
  lineHeight = 290 - lineMargin.top - lineMargin.bottom,
  format = d3.format(".2f");

var dropdown,
  linexScale,
  lineyScale,
  deathLine,
  vaccinationLine,
  lineSvg,
  dataMap_g,
  container,
  lineGroup;

//Define drawLine function
export function drawLineChart(containerId) {
  lineGroup = d3.select("." + containerId);

  container = d3.select(".line-legend-container");

  lineSvg = lineGroup
    .append("svg")
    .attr("class", "line-svg-c")

    .attr("width", lineWidth + lineMargin.left + lineMargin.right)
    .attr("height", lineHeight + lineMargin.top + lineMargin.bottom)
    .append("g")
    .attr(
      "transform",
      "translate(" + lineMargin.left + 25 + "," + lineMargin.top + ")"
    );
}

export function renderLineChart(dataMap, svgHeight) {
  dataMap_g = dataMap;
  const container = d3.select(".line-legend-container");

  // Create an array of country names for the dropdown menu
  var location_fromDataMap = Array.from(dataMap.keys());
  //console.log(location_fromDataMap);

  dropdown = d3.select(".dropdown-c");

  const lineLegend = d3.select(".line-legend");

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
    .text("Mortality Rate")
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
    .range([0, lineWidth]);

  lineyScale = d3.scaleLinear().domain([0, 200]).range([lineHeight, 0]);

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
      xAxis
        .tickFormat(d3.timeFormat("%b, %y"))
        .ticks(d3.timeMonth.every(1))
        .tickValues(
          d3.timeMonth.every(1).range(new Date(2020, 1), new Date(2021, 2))
        )
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
  // console.log(country);
  // console.log(countryData);

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
      // console.log("Something WRONG!!!!!");
      // console.log(d);
    }
    if (isNaN(+d.death_rate1) || isNaN(+d.vacc_rate)) {
      d.death_rate1 = 0;
      d.vacc_rate = 0;
      // console.log("Something WRONG!!!!!");
      // console.log(d);
    }
  });

  // Update the x scale domain
  linexScale.domain(
    d3.extent(countryData, function (d) {
      return new Date(+d.year, +d.month - 1);
    })
  );

  var deathRMax = d3.max(countryData, (d) => +d.death_rate1);
  var vaccRMax = d3.max(countryData, (d) => +d.vacc_rate);

  // console.log(deathRMax + ", " + vaccRMax);

  const max = d3.max(countryData, function (d) {
    if (+d.death_rate1 >= +d.vacc_rate) return +d.death_rate1;
    else return +d.vacc_rate;
  });

  // console.log(max);

  lineyScale = d3.scaleLinear().domain([0, max]).range([lineHeight, 0]);

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
    .call(d3.axisLeft(lineyScale));

  const curvetype = d3.curveCatmullRom;

  // Define line functions for death and vaccination rates
  const deathLineFunction = d3
    .line()
    .x(function (d) {
      //console.log(d);
      var xdate = new Date(d.year, d.month - 1);
      if (isNaN(xdate) || isNaN(linexScale(xdate))) {
        // console.log("SOMETHING WRONG!!");
      }
      // console.log(xdate + ", " + linexScale(xdate));
      return linexScale(xdate);
    })
    .y(function (d) {
      // console.log("death rate");
      // console.log(+d.death_rate1 + ", " + lineyScale(+d.death_rate1));
      return lineyScale(+d.death_rate1);
    })
    .curve(curvetype);

  const vaccinationLineFunction = d3
    .line() //.area()
    .x(function (d) {
      return linexScale(new Date(d.year, d.month - 1));
    })
    //.y0(lineHeight)
    .y(function (d) {
      // console.log("vaccination rate");
      // console.log(d.vacc_rate + ", " + d.vacc_rate);
      return lineyScale(+d.vacc_rate);
    })
    .curve(curvetype);

  // Update death line with data
  deathLine.datum(countryData).attr("d", deathLineFunction);

  // Update vaccination line with data
  vaccinationLine.datum(countryData).attr("d", vaccinationLineFunction);
  // Add a transparent rectangle over the SVG to capture mouse events

  lineSvg
    .append("rect")
    .attr("class", "overlay")
    .attr("width", lineWidth + lineMargin.left + lineMargin.right)
    .attr("height", lineHeight + lineMargin.top + lineMargin.bottom)
    // .attr("fill", "blue")
    .style("opacity", 0)
    .attr(
      "transform",
      "translate(",
      lineMargin.left + "," + lineMargin.top + ")"
    );

  lineSvg
    .on("mousemove", function (event, d) {
      // Get the mouse position
      const [mouseX, mouseY] = d3.pointer(event);

      // Calculate the corresponding date on the x-axis
      const xValue = linexScale.invert(mouseX);

      // Find the index of the data point closest to the mouse position for each line
      const bisect = d3.bisector((d) => new Date(d.year, d.month - 1)).left;
      const deathIndex = bisect(countryData, xValue);
      const vaccIndex = bisect(countryData, xValue);

      // Get the data points for each line at the closest dates to the mouse position
      const deathData = countryData[deathIndex];
      const vaccData = countryData[vaccIndex];

      // console.log(deathData);
      // console.log(vaccData);
      // console.log(
      //   vaccData.date +
      //     ": death rate: " +
      //     vaccData.death_rate1 +
      //     ", vacc rate: " +
      //     vaccData.vacc_rate +
      //     ", new deaths PM: " +
      //     vaccData.new_deaths_per_million +
      //     ", new cases PM: " +
      //     vaccData.new_cases_per_million
      // );

      var deathYValue = format(vaccData.death_rate1);
      var vaccinationYValue = format(vaccData.vacc_rate);
      var deathPMYValue = format(vaccData.new_deaths_per_million);
      var casesPMYValue = format(vaccData.new_cases_per_million);

      // Add the vertical line
      lineSvg
        .selectAll(".vertical-line")
        .data([xValue])
        .join(
          (enter) =>
            enter
              .append("line")
              .attr("class", "vertical-line")
              .attr("x1", mouseX)
              .attr("x2", mouseX)
              .attr("y1", 0)
              .attr("y2", lineHeight)
              .attr("stroke", "gainsboro")
              .attr("stroke-dasharray", "5 3"),
          (update) =>
            update.attr("x1", mouseX).attr("x2", mouseX).attr("y2", lineHeight),
          (exit) => exit.remove()
        );

      //Add the tooltip
      lineSvg
        .selectAll(".line-tooltip")
        .data([xValue])
        .join(
          (enter) =>
            enter
              .append("g")
              .attr("class", "line-tooltip")
              .attr("transform", `translate(${mouseX}, 0)`)
              .call((g) =>
                g
                  .append("rect")
                  .attr("class", "tooltip-background")
                  .attr("width", 200)
                  .attr("height", 100)
                  .attr("x", 10)
                  .attr(
                    "y",
                    (lineHeight - lineMargin.top - lineMargin.bottom) / 3
                  )
                  .attr("rx", 10)
                  .attr("ry", 10)
                  .style("fill", "#fff")
                  .style("stroke", "gainsboro")
              )
              .call(
                (g) =>
                  g
                    .append("text")
                    .attr("class", "tooltip-text")
                    .attr("x", 15)
                    .attr(
                      "y",
                      (lineHeight - lineMargin.top - lineMargin.bottom) / 3 + 20
                    )
                    .html(function () {
                      return `
                        <tspan x="14" dy="1em">New Deaths (PM): ${deathPMYValue}</tspan>
                        <tspan x="14" dy="1em">New Cases (PM): ${casesPMYValue}</tspan>
                        <tspan x="14" dy="1em">Mortality Rate: ${deathYValue}%</tspan>
                        <tspan x="14" dy="1em">Vaccination Rate: ${vaccinationYValue}%</tspan>
                      `;
                    })
                    .style("fill", "#777777")
                    .transition()
                    .delay(1000)
                    .duration(500)
                    .style("opacity", 1)
                // .style("white-space", "pre-wrap")
              ),
          (update) => update.attr("transform", `translate(${mouseX}, 0)`),
          (exit) => exit.transition().duration(500).style("opacity", 0).remove()
        );
    })
    .on("mouseout", function () {
      // Remove the vertical line and tooltip
      lineSvg.selectAll(".vertical-line").remove();
      lineSvg.selectAll(".line-tooltip").remove();
      lineSvg.selectAll(".tooltip-text").remove();
    });
}
