/* The driving file for all the visualizations.
Tasks:
  Implement the K-Means algorithm from scratch
  Data - between wave 1 and wave 2, and wave 2 and wave 3 of covid.
  Perform clustering based on user selection.
Functions:
  kMeans() - perform clustering
  scatterPlot() - set up the base for scatter plot
  clusterAndRenderScatterPlot() - call kmeans and render scatter plot with results
*/

import { fixData } from "./heatmap.js";
import {
  wave1year,
  wave2year,
  wave3year,
  wave1month,
  wave2month,
  wave3month,
} from "./app.js";

const margin = { top: 10, bottom: 45, left: 90, right: 30 },
  width = 1000 - margin.left - margin.right,
  height = 600 - margin.top - margin.bottom;

var svg;

/* perform clustering */
function kMeans(k, maxIterations, featureVectors) {
  // console.log("kMeans Program!!");

  // Randomly initialize the centroids
  var centroids = d3.range(k).map(function (i) {
    return [
      d3.randomUniform(
        d3.min(featureVectors, function (d) {
          return d[0];
        }),
        d3.max(featureVectors, function (d) {
          return d[0];
        })
      )(),
      d3.randomUniform(
        d3.min(featureVectors, function (d) {
          return d[1];
        }),
        d3.max(featureVectors, function (d) {
          return d[1];
        })
      )(),
    ];
  });

  // console.log("Initialized centroids");
  // console.log(centroids);

  for (var iteration = 0; iteration < maxIterations; iteration++) {
    // Assign each point to its closest centroid
    var assignments = featureVectors.map(function (point) {
      var distances = centroids.map(function (centroid) {
        return Math.sqrt(
          Math.pow(point[0] - centroid[0], 2) +
            Math.pow(point[1] - centroid[1], 2)
        );
      });
      return d3.minIndex(distances);
    });

    // Recalculate the centroids as the mean of the assigned points
    var newCentroids = centroids.map(function (centroid, i) {
      var assignedPoints = featureVectors.filter(function (d, j) {
        return assignments[j] === i;
      });
      if (assignedPoints.length > 0) {
        return [
          d3.mean(assignedPoints, function (d) {
            return d[0];
          }),
          d3.mean(assignedPoints, function (d) {
            return d[1];
          }),
        ];
      } else {
        // console.log(centroid);
        return centroid;
      }
    });

    // Check if the centroids have converged
    if (
      centroids.every(function (d, i) {
        return d[0] === newCentroids[i][0] && d[1] === newCentroids[i][1];
      })
    ) {
      break;
    } else {
      centroids = newCentroids;
    }
  }

  // Assign each point to its corresponding cluster
  var assignments = featureVectors.map(function (point) {
    var distances = centroids.map(function (centroid) {
      return Math.sqrt(
        Math.pow(point[0] - centroid[0], 2) +
          Math.pow(point[1] - centroid[1], 2)
      );
    });
    return d3.minIndex(distances);
  });

  return { assignments: assignments, centroids: centroids };
}

/* Set up the scatter plot */
export function scatterPlot(monthly, containerId) {
  const gdpData = monthly.filter(
    (d) =>
      (+d.year >= wave1year &&
        +d.month >= wave1month &&
        +d.year <= wave2year &&
        +d.month <= wave2month) ||
      (+d.year >= wave2year &&
        +d.month >= wave2month &&
        +d.year <= wave3year &&
        +d.month <= wave3month)
  );

  containerId = "scatter-chart";

  const data = fixData(gdpData);
  // const data = fixData(monthly);

  const scattertooltip = d3
    .select("." + containerId)
    .append("div")
    .attr("class", "scattertooltip-c")
    .style("opacity", 0)
    .style("position", "absolute");

  var clusterGroup = d3.select("#" + containerId);

  const legend = d3
    .select(".scatter-legend")
    .append("svg")
    .attr("class", "scatter-legend-c")
    .attr("width", 250)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${margin.left - 50},${margin.top})`);

  const dropdown = legend
    .append("svg")
    .attr("class", "scatter-dropdown")
    .attr("width", 165)
    .attr("height", 100);

  dropdown
    .append("rect")
    .attr("class", "scatter-dropdown-button")
    .attr("width", 165)
    .attr("height", 100);

  dropdown
    .selectAll(".scatter-dropdown-option")
    .data([
      "GDP Per Capita",
      "Vaccination Rate",
      "Stringency Index",
      "Population Density",
    ])
    .enter()
    .append("text")
    .attr("class", "scatter-dropdown-option")
    .attr("id", (d, i) => "scatter-option" + (i + 1))
    .attr("x", 14)
    .attr("y", (d, i) => 30 + i * 20)
    .text((d) => d);

  // Chart creation

  svg = d3
    .select(".scatter-chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  clusterAndRenderScatterPlot("scatter-option1", clusterGroup, data);

  d3.selectAll(".scatter-dropdown-option").on("click", function (event, d, i) {
    clusterAndRenderScatterPlot(d3.select(this).attr("id"), clusterGroup, data);
  });
}

var x, y, scatterX, scatterY, scatterXLabel, scatterYLabel;

/* Perform the clustering by calling kmeans and render the scatter plot */
function clusterAndRenderScatterPlot(optionId, clusterGroup, data) {
  // console.log("Scatter Plot:");
  // console.log(data);

  d3.select("#scatter-option1").style("font-weight", "normal");
  d3.select("#scatter-option2").style("font-weight", "normal");
  d3.select("#scatter-option3").style("font-weight", "normal");
  d3.select("#scatter-option4").style("font-weight", "normal");
  d3.select("#" + optionId).style("font-weight", "bold");

  var xAxisLabel;

  /* Set up the feature vector for clustering based on user selection */
  var featureVectors = data.map(function (d) {
    if (optionId == "scatter-option1") {
      xAxisLabel = "GDP per capita";
      return [+d.gdp_per_capita, d.new_cases_per_million];
    } else if (optionId == "scatter-option2") {
      xAxisLabel = "Vaccination Rate";
      return [+d.vacc_rate, d.new_cases_per_million];
    } else if (optionId == "scatter-option3") {
      xAxisLabel = "Stringency Index";
      return [+d.stringency_index, d.new_cases_per_million];
    } else {
      xAxisLabel = "Population Density";
      return [+d.population_density, d.new_cases_per_million];
    }
  });

  // console.log(featureVectors);

  var scatterCircles = d3.selectAll(".scatter-c");
  if (scatterCircles) {
    scatterCircles.remove();
  }
  if (scatterX) scatterX.remove();
  if (scatterY) scatterY.remove();
  if (scatterXLabel) scatterXLabel.remove();
  if (scatterYLabel) scatterYLabel.remove();

  const k = 4,
    maxIterations = 300;

  var result = kMeans(k, maxIterations, featureVectors);

  // Create a color scale for the clusters
  var colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(d3.range(k));
  x = d3
    .scaleLinear()
    .domain([
      d3.min(featureVectors, function (d) {
        return d[0];
      }),
      d3.max(featureVectors, function (d) {
        return d[0];
      }),
    ])
    .range([0, width]);

  y = d3
    .scaleLinear()
    .domain([
      d3.min(featureVectors, function (d) {
        return d[1];
      }),
      d3.max(featureVectors, function (d) {
        return d[1];
      }),
    ])
    .range([height, 0]);

  var xAxis = d3.axisBottom(x);

  scatterX = svg
    .append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  scatterXLabel = svg
    .append("text")
    .attr("text-anchor", "middle")
    .attr("class", "scatter-x-label")
    .attr("x", width / 2)
    .attr("y", height + 35)
    .text(xAxisLabel);

  var yAxis = d3.axisLeft(y).tickFormat(function (d) {
    return d / 1000 + "";
  });
  scatterY = svg.append("g").call(yAxis);

  scatterYLabel = svg
    .append("text")
    .attr("text-anchor", "middle")
    .attr("class", "scatter-y-label")
    .attr(
      "transform",
      "translate(" + (-margin.left + 50) + "," + height / 2 + ")rotate(-90)"
    )
    .text("New cases per million");

  /* For the scatter points */

  svg
    .selectAll("circle")
    .data(featureVectors)
    .enter()
    .append("circle")
    .attr("class", "scatter-c")
    .transition()
    // .duration(150)
    // .delay((d, i) => i)
    .attr("cx", function (d) {
      return x(d[0]);
    })
    .attr("cy", function (d) {
      return y(d[1]);
    })
    .attr("r", 5)
    .style("fill", function (d, i) {
      return colorScale(result.assignments[i]);
    });
}
