import { filterData } from "./app.js";
import { bubbleSvg } from "./app.js";
import { updateLineChart } from "./linechart.js";

var firstTime = 0;
export { firstTime };

const bubbleMargin = { top: 20, bottom: 50, left: 50, right: 20 },
  bubbleWidth = 500 - bubbleMargin.left - bubbleMargin.right,
  bubbleHeight = 480 - bubbleMargin.top - bubbleMargin.bottom;

const bubbletooltip = d3
  .select("body")
  .append("div")
  .attr("class", "bubbletooltip-c")
  .style("opacity", 0)
  .style("position", "absolute");

var bubbleChart,
  readyForBubble = 0,
  bubbleX,
  bubbleY,
  bubbleTickFormatter,
  bubbleR,
  bubbleColor,
  bubbleID,
  bubbleIsoCode,
  isoToCountry = {};

export function renderBubbleChart(year, month, monthly, myIsoCodes) {
  console.log("month and year in renderBubble: " + month + "," + year);

  if (bubbleChart) {
    bubbleChart.remove();
  }

  // Loop through the data and populate the mapping object
  monthly.forEach(function (d) {
    isoToCountry[d.iso_code] = d.location;
  });

  var dataForAMonth_b = filterData(month, year, monthly);
  // console.log(dataForAMonth_b);
  // console.log(myIsoCodes);

  var myDataForAMonth_b = dataForAMonth_b.filter(function (d) {
    //console.log(d.iso_code);
    return myIsoCodes.includes(d.iso_code);
  });

  //console.log(myDataForAMonth_b);

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
        return d.new_cases > 0 ? d.new_cases : 0.1;
      }),
      d3.max(myDataForAMonth_b, (d) => d.new_cases) * 10,
    ])
    .range([bubbleHeight, 0]);

  // Create a tick formatter function that formats the ticks uniformly
  bubbleTickFormatter = bubbleY.tickFormat(10, "~s");

  bubbleR = d3
    .scaleLinear()
    .domain([0, d3.max(myDataForAMonth_b, (d) => d.population_density)])
    .range([20, 60]);

  /* For reference: ["USA", "CHN", "AUS", "GUY", "CAF"]; */
  bubbleColor = d3.scaleOrdinal().domain(myIsoCodes).range(d3.schemeCategory10);
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
    )
    .attr("id", "bubblechart");

  var periodText = d3.select(".period-text");
  var period = periodText.text();

  if (d3.select(".bubble-title-c")) {
    d3.select(".bubble-title-c").remove();
  }

  bubbleSvg
    .append("text")
    .attr("x", bubbleWidth / 2 + bubbleMargin.left + 20)
    .attr("y", bubbleMargin.top + 5 / 2)
    .attr("text-anchor", "middle")
    .attr("class", "bubble-title-c")
    .attr("id", "covid-response")
    .text("Impact of Stringency & Population (" + period + ")");

  bubbleChart
    .selectAll("circle")
    .data(myDataForAMonth_b)
    .join("circle")
    .attr("id", (d) => d.iso_code + "-bubble")
    .attr("class", "countrybubbles")
    .attr("cx", (d) => bubbleX(d.stringency_index))
    .attr("cy", (d) => (d.new_cases == 0 ? bubbleY(0.1) : bubbleY(d.new_cases)))
    .transition()
    .duration(500)
    .delay((d, i) => i * 100)
    .attr("r", (d) => bubbleR(d.population_density))
    .attr("stroke", (d) => bubbleColor(d.iso_code))
    .attr("fill", (d) => bubbleColor(d.iso_code))
    .attr("fill-opacity", "0.1")
    .attr("stroke-opacity", "1");

  const xAxis = d3.axisBottom(bubbleX);
  const yAxis = d3.axisLeft(bubbleY).tickFormat(bubbleTickFormatter);

  bubbleChart
    .append("g")
    .attr("class", "bubble-xaxis")
    .attr("transform", `translate(0, ${bubbleHeight})`)
    .call(xAxis);

  bubbleChart.append("g").attr("class", "bubble-yaxis").call(yAxis);

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
    .attr("y", -bubbleMargin.left + 15)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .attr("class", "bubble-yaxis-c")
    .attr("id", "total-cases")
    .text("New Cases");

  d3.selectAll(".countrybubbles")
    .on("mouseover", function (event, d) {
      (bubbleID = d3.select(this).attr("id")), (bubbleIsoCode = d.iso_code);
      //console.log(bubbleID + ", " + bubbleIsoCode);
      d3.select(this).style("opacity", 0.7);
      bubbletooltip
        .html(
          "<div class=bubbletooltip-text>" +
            "<strong>" +
            d.location +
            "</strong>" +
            "<br> New Cases: " +
            (typeof d.new_cases == "undefined" ? 0 : d.new_cases.toFixed(0)) +
            "<br> Stringency Index: " +
            Math.ceil(d.stringency_index) +
            "<br> Population Density: " +
            Math.ceil(d.population_density) +
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
      //console.log("Country value: " + value);

      // set the value of the dropdown to a specific country
      dropdown.property("value", value);

      // call the updateChart function with the new dropdown value
      updateLineChart(dropdown.property("value"));
    });

  //console.log("Incrementing firstTime");
  firstTime++;
}
