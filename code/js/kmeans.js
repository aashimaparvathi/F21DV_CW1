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

  // Return the assignments and centroids
  // console.log("assignments");
  // console.log(assignments);
  // console.log("centroids");
  // console.log(centroids);
  return { assignments: assignments, centroids: centroids };
}

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

function clusterAndRenderScatterPlot(optionId, clusterGroup, data) {
  // console.log("Scatter Plot:");
  // console.log(data);

  d3.select("#scatter-option1").style("font-weight", "normal");
  d3.select("#scatter-option2").style("font-weight", "normal");
  d3.select("#scatter-option3").style("font-weight", "normal");
  d3.select("#scatter-option4").style("font-weight", "normal");
  d3.select("#" + optionId).style("font-weight", "bold");

  var xAxisLabel;
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

  // if (optionId == "scatter-option1" || optionId == "scatter-option4") {
  //   // console.log("Changing Y AXIS");
  //   y = d3
  //     .scaleLinear()
  //     .domain([
  //       d3.min(featureVectors, function (d) {
  //         return d[1];
  //       }),
  //       d3.max(featureVectors, function (d) {
  //         return d[1];
  //       }),
  //     ])
  //     .range([height, 0]);
  // }

  var xAxis = d3.axisBottom(x);
  // .tickFormat(function (d) {
  //   return d / 1000 + "";
  // });

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
    //    .attr("transform", "translate(" + width / 2 + "," + height + ")")
    .text(xAxisLabel);

  var yAxis = d3.axisLeft(y).tickFormat(function (d) {
    return d / 1000 + "";
  });
  scatterY = svg.append("g").call(yAxis);

  scatterYLabel = svg
    .append("text")
    .attr("text-anchor", "middle")
    .attr("class", "scatter-y-label")
    // .attr("x", -height / 2)
    // .attr("y", -margin.left)
    .attr(
      "transform",
      "translate(" + (-margin.left + 50) + "," + height / 2 + ")rotate(-90)"
    )
    .text("New cases per million");

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

//
//
//
//
//
//
//
//
//

export function kMeans2(k, maxIterations, monthly, containerId) {
  const data = fixData(monthly);

  var countries = data.map(function (d) {
    return {
      country: d.location,
      gdp_per_capita: +d.gdp_per_capita,
      new_cases: +d.new_cases,
    };
  });

  // Initialize k random centroids
  var centroids = [];
  for (var i = 0; i < k; i++) {
    centroids.push({
      gdp_per_capita:
        Math.random() *
        d3.max(countries, function (d) {
          return d.gdp_per_capita;
        }),
      new_cases:
        Math.random() *
        d3.max(countries, function (d) {
          return d.new_cases;
        }),
    });
  }

  // Assign countries to clusters
  var maxIterations = 10;
  var iterations = 0;
  var clusters;
  do {
    clusters = new Array(k);
    for (var i = 0; i < k; i++) {
      clusters[i] = [];
    }

    countries.forEach(function (country) {
      var minDistance = Infinity;
      var closestCentroid;
      centroids.forEach(function (centroid) {
        var distance = Math.sqrt(
          Math.pow(country.gdp_per_capita - centroid.gdp_per_capita, 2) +
            Math.pow(country.new_cases - centroid.new_cases, 2)
        );
        if (distance < minDistance) {
          minDistance = distance;
          closestCentroid = centroid;
        }
      });
      clusters[centroids.indexOf(closestCentroid)].push(country);
    });

    // Update centroids
    var converged = true;
    for (var i = 0; i < k; i++) {
      var meanGdpPerCapita = d3.mean(clusters[i], function (d) {
        return d.gdp_per_capita;
      });
      var meanNewCases = d3.mean(clusters[i], function (d) {
        return d.new_cases;
      });
      if (
        centroids[i].gdp_per_capita !== meanGdpPerCapita ||
        centroids[i].new_cases !== meanNewCases
      ) {
        centroids[i].gdp_per_capita = meanGdpPerCapita;
        centroids[i].new_cases = meanNewCases;
        converged = false;
      }
    }

    iterations++;
  } while (!converged && iterations < maxIterations);

  var clusterGroup = d3.select("#" + containerId);

  var svg = clusterGroup
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var padding = 50;

  // Create a color scale for the clusters
  // var colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(d3.range(k));

  // Create x-axis and label
  var xScale = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(countries, function (d) {
        return d.gdp_per_capita;
      }),
    ])
    .range([0, width]);

  var xAxis = d3.axisBottom(xScale);

  svg
    .append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  svg
    .append("text")
    .attr("text-anchor", "middle")
    .attr("transform", "translate(" + width / 2 + "," + height / 4 + ")")
    .text("GDP per capita");

  // Create y-axis and label
  var yScale = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(countries, function (d) {
        return d.new_cases;
      }),
    ])
    .range([height, 0]);

  var yAxis = d3.axisLeft(yScale);

  svg.append("g").attr("transform", "translate(0,0)").call(yAxis);

  svg
    .append("text")
    .attr("text-anchor", "middle")
    .attr("transform", "translate(0," + height / 2 + ")rotate(-90)")
    .text("New COVID cases");

  // Create circles for each country and color according to cluster
  var color = d3.scaleOrdinal(d3.schemeCategory10);

  var circles = svg
    .selectAll("circle")
    .data(countries)
    .enter()
    .append("circle")
    .attr("cx", function (d) {
      return xScale(d.gdp_per_capita);
    })
    .attr("cy", function (d) {
      return yScale(d.new_cases);
    })
    .attr("r", 5)
    .style("fill", function (d) {
      return color(clusters[centroids.indexOf(d.cluster)]);
    });

  circles
    .on("mouseover", function (event, d) {
      scattertooltip
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
        .style("opacity", 0.7);
    })
    .on("mouseout", function (event, d) {
      scattertooltip.style("opacity", 0);
    });
}
