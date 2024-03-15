function createPCASummaryTable(pcaData, selectedPC = 15) {
  // Clear previous table content
  
  const container = d3.select("#pcaDetailsTableContainer");
  container.html("");
  selectedPC = selectedPC < pcaData.length ? selectedPC : pcaData.length;
  pcaData = pcaData[pcaData.length - 1];
  document.getElementById("elbowPlot").innerHTML = "";
  document.getElementById("plots").innerHTML = "";
  const clusterToggleButton = document.getElementById("clusterToggle");
  clusterToggleButton.style.display = "none";
  // Create the table structure
  // Inside the createPCASummaryTable function
  const table = container.append("table").attr("class", "pca-details-table");
  const nameMapping = {
    rank: "Rank",
    finalWorth: "FinalWorth",
    age: "Age",
    birthYear: "Birth Year",
    birthMonth: "Birth Month",
    birthDay: "Birth Day",
    cpi_country: "CPI-Country",
    gdp_country: "GDP",
    gross_primary_education_enrollment_country: "Edu Enrollement",
    life_expectancy_country: "Life Expectency",
    tax_revenue_country_country: "Tax Revenue",
    total_tax_rate_country: "Total Tax",
    population_country: "Population",
    latitude_country: "Latitude Country",
    longitude_country: "Longitude Country"
  };
  const thead = table.append("thead");
  const tbody = table.append("tbody");

  // Create the header row for the table
  const headerRow = thead.append("tr");
  headerRow.append("th").text("Attribute"); // First header cell for attribute names

  // Add headers for PC1 through PC15
  for (let i = 1; i < pcaData.length - 1; i++) {
    headerRow.append("th").text(`PC${i}`);
  }

  // Add a header for "Squared Sum"
  headerRow.append("th").text("Squared Sum");

  // Add data to the table body
  const attributes = pcaData[0].slice(1); // Skip the first element, which is "Attribute"
  attributes.forEach((attribute, attrIndex) => {
    const row = tbody.append("tr");

    if (attrIndex < 4) {
      row.attr("class", "highlight"); // Add a class to highlight the row
    }
    const mappedName = nameMapping[attribute] || attribute;
    row.append("td").text(mappedName); // First column with the attribute name

    // Add columns for each principal component's loading
    for (let pcIndex = 1; pcIndex <= selectedPC; pcIndex++) {
      const value = pcaData[pcIndex][attrIndex + 1]; // Offset by 1 due to header
      row
        .append("td")
        .text(typeof value === "number" ? value.toFixed(4) : value);
    }

    // Add column for squared sum
    const squaredSumValue = pcaData[pcaData.length - 1][attrIndex + 1]; // Squared sum is the last array
    row
      .append("td")
      .text(
        typeof squaredSumValue === "number"
          ? squaredSumValue.toFixed(4)
          : squaredSumValue
      );
  });
}
var SPMDataTop;
var screePlotSelected=false;
function getSelectedPCData(pcaData, selectedPCIndex) {
  debugger;
  pcaData = pcaData[selectedPCIndex - 1];
  const squaredSumsRow = pcaData[pcaData.length - 1];
  const attributeNames = pcaData[0];
  const squaredSumsWithAttributes = [];

  // Start from index 1 to skip the "Attribute" label in the header row
  for (let i = 1; i < squaredSumsRow.length; i++) {
    squaredSumsWithAttributes.push({
      attribute: attributeNames[i],
      squaredSum: squaredSumsRow[i],
    });
  }
  // Sort by squared sum in descending order
  squaredSumsWithAttributes.sort((a, b) => b.squaredSum - a.squaredSum);
  // Select the top 4 attributes based on squared sum
  const top4Attributes = squaredSumsWithAttributes
    .slice(0, 4)
    .map((d) => d.attribute);
  console.log(top4Attributes);
  fetch("/set-top-attributes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ top4Attributes: top4Attributes }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Response from server:", data);
      // Handle the response data here
      SPMDataTop = top4Attributes
      generateScatterPlotMatrix(data);
    })
    .catch((error) => console.error("Error:", error));
}

function updateTableForSelectedComponent(selectedComponent) {
  fetch(`/pca-data/${selectedComponent}`)
    .then((response) => response.json())
    .then((data) => {
      createPCASummaryTable(data, selectedComponent);
      getSelectedPCData(pcaData, selectedComponent);
    })
    .catch((error) => console.error("Error fetching PCA data:", error));
}

function createCombinedGraph(varianceExplained, cumulativeVariance) {
  // Assuming varianceExplained and cumulativeVariance are already in percentage form.
  // If not, multiply each by 100.

  const data = varianceExplained.map((ve, i) => ({
    component: i + 1,
    variance: ve * 100, // Convert to percentage if necessary
    cumulative: cumulativeVariance[i] * 100, // Convert to percentage if necessary
  }));

  // Set dimensions and margins
  const margin = { top: 30, right: 30, bottom: 70, left: 60 },
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

  // Remove any existing graph before drawing a new one
  d3.select("#combinedPlot").select("svg").remove();

  // Append SVG object to the body
  const svg = d3
    .select("#combinedPlot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

    svg
    .append("text")
    .attr("class", "graph-title")
    .attr("x", width / 2)
    .attr("y", 0 - margin.top / 2 + 10)
    .attr("text-anchor", "middle")
    .style("font-size", "20px")
    .style("text-decoration", "underline")
    .text("Scree Plot");

  // X axis - Principal Components
  const x = d3
    .scaleBand()
    .range([0, width])
    .domain(data.map((d) => d.component))
    .padding(0.2);
  svg
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  // Y axis - Percentage of Variance
  const y = d3
    .scaleLinear()
    .domain([0, 100]) // Assuming the scale from 0 to 100% for both variance and cumulative variance
    .range([height, 0]);
  svg.append("g").call(d3.axisLeft(y));

  // Bars for Variance Explained
  svg
    .selectAll(".bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("class", (d) => `bar pc-${d.component}`) // Assign class based on component
    .attr("x", (d) => x(d.component))
    .attr("y", (d) => y(d.variance))
    .attr("width", x.bandwidth())
    .attr("height", (d) => height - y(d.variance))
    .attr("fill", "#FE676E");

  // X axis label
  svg
    .append("text")
    .attr("transform", `translate(${width / 2}, ${height + margin.top + 20})`) // Positioning the X-axis label
    .style("text-anchor", "middle")
    .text("Principal Components");

  // Y axis label
  svg
    .append("text")
    .attr("transform", "rotate(-90)") // Rotating the text for the Y-axis label
    .attr("y", 0 - margin.left) // Positioning based on the margin
    .attr("x", 0 - height / 2)
    .attr("dy", "1em") // Adjusting the distance from the axis
    .style("text-anchor", "middle")
    .text("% of Variance Explained");

  // Line for Cumulative Variance
  const line = d3
    .line()
    .x((d) => x(d.component) + x.bandwidth() / 2) // Center the line in the middle of the band
    .y((d) => y(d.cumulative)); // Use the y scale for cumulative variance

  // Draw the line
  svg
    .append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("d", line);

  // Optionally, add dots for each cumulative variance point
  svg
    .selectAll(".dot")
    .data(data)
    .enter()
    .append("circle")
    .attr("class", "dot")
    .attr("cx", (d) => x(d.component) + x.bandwidth() / 2)
    .attr("cy", (d) => y(d.cumulative))
    .attr("r", 5)
    .attr("fill", "red")
    .on("click", function (event, d) {
      // Call createPCASummaryTable with the selected PC component number
      updateTableForSelectedComponent(d.component);
      screePlotSelected = true
    })
    .on("mouseover", function (event, d) {
      // Highlight the corresponding bar by changing its color
      d3.selectAll(`.bar.pc-${d.component}`).attr("fill", "orange");

      // Change the dot's color to indicate it's being hovered over
      d3.select(this).attr("fill", "yellow"); // Change dot color on hover
    })
    // Add mouseout event
    .on("mouseout", function (event, d) {
      // Revert the bar color back to its original
      d3.selectAll(`.bar.pc-${d.component}`).attr("fill", "#FE676E");

      // Revert the dot's color back to red
      d3.select(this).attr("fill", "red"); // Revert dot color when not hovering
    });
}

function generateScatterPlotMatrix(scatter_plot_matrix) {
    debugger
    if(!screePlotSelected) window.alert("Please select the Scree Plot First");
    if(SPMDataTop){
        fetch("/set-top-attributes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ top4Attributes: SPMDataTop }),
        })
        .then((response) => response.json())
        .then((data) => {
            console.log("Response from server:", data);
            // Handle the response data here
            scatter_plot_matrix = data
     
  var graphData = JSON.parse(scatter_plot_matrix);

  d3.select("#scatterPlotMatrix").html("");
  size = 300;
  padding = 35;
  width = 2500;
  height = 2200;

  var frameBackgroundColor = "#4db3b1"; // Light gray background for the frame
  var dataPointColor = "#9b4db3"; // Orange color for data points

  var x = d3.scaleLinear().range([padding / 2, size - padding / 2]);

  var y = d3.scaleLinear().range([size - padding / 2, padding / 2]);

  var xAxis = d3.axisBottom(x);

  var yAxis = d3.axisLeft(y);

  var color = d3.scaleOrdinal(d3.schemeCategory10);
  var xOffset = (width - size * n) / 2;
  var svg = d3
    .select("#scatterPlotMatrix")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr(
      "transform",
      "translate(" + (padding + 250) + "," + (padding / 2 + 250) + ")"
    );
    
  var domainByTrait = {},
    traits = Object.keys(graphData[0]).filter(function (d) {
      return d !== "cluster";
    }), //don't return name
    n = traits.length;

  traits.forEach(function (trait) {
    domainByTrait[trait] = d3.extent(graphData, function (d) {
      return d[trait];
    });
  });

  xAxis.tickSize(size * n);
  yAxis.tickSize(-size * n);

  svg.selectAll("g").remove();

  svg
    .selectAll(".x.axis")
    .data(traits)
    .enter()
    .append("g")
    .attr("class", "x axis")
    .attr("transform", function (d, i) {
      return "translate(" + (n - i - 1) * size + ",0)";
    })
    .each(function (d) {
      x.domain(domainByTrait[d]);
      d3.select(this)
        .call(xAxis)
        .selectAll("line, text")
        .style("stroke", "black")
        .style("fill", "black");
    });

  svg
    .selectAll(".y.axis")
    .data(traits)
    .enter()
    .append("g")
    .attr("class", "y axis")
    .attr("transform", function (d, i) {
      return "translate(0," + i * size + ")";
    })
    .each(function (d) {
      y.domain(domainByTrait[d]);
      d3.select(this)
        .call(yAxis)
        .selectAll("line, text")
        .style("stroke", "black")
        .style("fill", "black");
    });

  var cell = svg
    .selectAll(".cell")
    .data(cross(traits, traits))
    .enter()
    .append("g")
    .attr("class", "cell")
    .attr("transform", function (d) {
      return "translate(" + (n - d.i - 1) * size + "," + d.j * size + ")";
    })
    .each(plot);

  cell
    .append("text")
    .attr("x", padding + 125)
    .attr("y", padding - 55)
    .attr("dy", "1.5em")
    .style("font-weight", "bold")
    .style("font", "bold 10px sans-serif") // Larger, bolder font
    .style("text-anchor", "middle")
    .style("background", "black")
    .text(function (d) {
      return d.y + " vs " + d.x;
    });
    svg
    .append("text")
    .attr("class", "graph-title")
    .attr("x", (width / 2-650))
    .attr("y", -40) // Adjust this value to position the title; 20 is a small padding from the top of the SVG
    .attr("text-anchor", "middle")
    .style("font-size", "20px")
    .style("text-decoration", "underline")
    .text("Scatter Plot Matrix"); // Replace with your desired title

  var color = d3.scaleOrdinal(d3.schemeCategory10);
  function plot(p) {
    var cell = d3.select(this);

    x.domain(domainByTrait[p.x]);
    y.domain(domainByTrait[p.y]);

    cell
      .append("rect")
      .attr("class", "frame")
      .attr("x", padding / 2)
      .attr("y", padding / 2)
      .attr("width", size - padding)
      .attr("height", size - padding)
      .style("fill", frameBackgroundColor) // New background color for the frame
      .style("stroke", "black") // Black border color
      .style("stroke-width", 2) // Border thickness
      .style("pointer-events", "all") // Allow pointer events on the rectangle
      .style("overflow", "visible");
    cell
      .selectAll("circle")
      .data(graphData)
      .enter()
      .append("circle")
      .attr("cx", function (d) {
        return x(d[p.x]);
      })
      .attr("cy", function (d) {
        return y(d[p.y]);
      })
      .attr("r", 2)
      .style("fill", (d) => color(d.cluster)); // Color based on cluster
  }
})
.catch((error) => console.error("Error:", error));
}
else{
    var graphData = JSON.parse(scatter_plot_matrix);

  d3.select("#scatterPlotMatrix").html("");
  size = 300;
  padding = 35;
  width = 2500;
  height = 2200;

  var frameBackgroundColor = "#4db3b1"; // Light gray background for the frame
  var dataPointColor = "#9b4db3"; // Orange color for data points

  var x = d3.scaleLinear().range([padding / 2, size - padding / 2]);

  var y = d3.scaleLinear().range([size - padding / 2, padding / 2]);

  var xAxis = d3.axisBottom(x);

  var yAxis = d3.axisLeft(y);

  var color = d3.scaleOrdinal(d3.schemeCategory10);
  var xOffset = (width - size * n) / 2;
  var svg = d3
    .select("#scatterPlotMatrix")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr(
      "transform",
      "translate(" + (padding + 250) + "," + (padding / 2 + 250) + ")"
    );

  var domainByTrait = {},
    traits = Object.keys(graphData[0]).filter(function (d) {
      return d !== "cluster";
    }), //don't return name
    n = traits.length;

  traits.forEach(function (trait) {
    domainByTrait[trait] = d3.extent(graphData, function (d) {
      return d[trait];
    });
  });

  xAxis.tickSize(size * n);
  yAxis.tickSize(-size * n);

  svg.selectAll("g").remove();

  svg
    .selectAll(".x.axis")
    .data(traits)
    .enter()
    .append("g")
    .attr("class", "x axis")
    .attr("transform", function (d, i) {
      return "translate(" + (n - i - 1) * size + ",0)";
    })
    .each(function (d) {
      x.domain(domainByTrait[d]);
      d3.select(this)
        .call(xAxis)
        .selectAll("line, text")
        .style("stroke", "black")
        .style("fill", "black");
    });

  svg
    .selectAll(".y.axis")
    .data(traits)
    .enter()
    .append("g")
    .attr("class", "y axis")
    .attr("transform", function (d, i) {
      return "translate(0," + i * size + ")";
    })
    .each(function (d) {
      y.domain(domainByTrait[d]);
      d3.select(this)
        .call(yAxis)
        .selectAll("line, text")
        .style("stroke", "black")
        .style("fill", "black");
    });

    svg
    .append("text")
    .attr("class", "graph-title")
    .attr("x", (width / 2-650))
    .attr("y", -40) // Adjust this value to position the title; 20 is a small padding from the top of the SVG
    .attr("text-anchor", "middle")
    .style("font-size", "20px")
    .style("text-decoration", "underline")
    .text("Scatter Plot Matrix"); // Replace with your desired title

  var cell = svg
    .selectAll(".cell")
    .data(cross(traits, traits))
    .enter()
    .append("g")
    .attr("class", "cell")
    .attr("transform", function (d) {
      return "translate(" + (n - d.i - 1) * size + "," + d.j * size + ")";
    })
    .each(plot);

  cell
    .append("text")
    .attr("x", padding + 125)
    .attr("y", padding - 55)
    .attr("dy", "1.5em")
    .style("font-weight", "bold")
    .style("font", "bold 10px sans-serif") // Larger, bolder font
    .style("text-anchor", "middle")
    .style("background", "black")
    .text(function (d) {
      return d.y + " vs " + d.x;
    });

  var color = d3.scaleOrdinal(d3.schemeCategory10);
  function plot(p) {
    var cell = d3.select(this);

    x.domain(domainByTrait[p.x]);
    y.domain(domainByTrait[p.y]);

    cell
      .append("rect")
      .attr("class", "frame")
      .attr("x", padding / 2)
      .attr("y", padding / 2)
      .attr("width", size - padding)
      .attr("height", size - padding)
      .style("fill", frameBackgroundColor) // New background color for the frame
      .style("stroke", "black") // Black border color
      .style("stroke-width", 2) // Border thickness
      .style("pointer-events", "all") // Allow pointer events on the rectangle
      .style("overflow", "visible");
    cell
      .selectAll("circle")
      .data(graphData)
      .enter()
      .append("circle")
      .attr("cx", function (d) {
        return x(d[p.x]);
      })
      .attr("cy", function (d) {
        return y(d[p.y]);
      })
      .attr("r", 2)
      .style("fill", (d) => color(d.cluster)); // Color based on cluster
  }
}
}

function cross(a, b) {
  var c = [],
    n = a.length,
    m = b.length,
    i,
    j;
  for (i = -1; ++i < n; )
    for (j = -1; ++j < m; ) c.push({ x: a[i], i: i, y: b[j], j: j });
  console.log(c);
  return c;
}

function plotElbowGraph(mse) {
  const svgWidth = 600,
    svgHeight = 400;
  const margin = { top: -5, right: 10, bottom: 40, left: 50 };
  const width = svgWidth - margin.left - margin.right;
  const height = svgHeight - margin.top - margin.bottom;
  const optimalK = 4; // Example: optimal number of clusters found

  document.getElementById("elbowPlot").innerHTML = "";
  document.getElementById("combinedPlot").innerHTML = "";
  document.getElementById("pcaDetailsTableContainer").innerHTML = "";
  document.getElementById("scatterPlotMatrix").innerHTML = "";

  // Create SVG container
  const svg = d3
    .select("#elbowPlot")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

    svg
    .append("text")
    .attr("class", "graph-title")
    .attr("x", width / 2)
    .attr("y", 0 - margin.top / 2 + 10)
    .attr("text-anchor", "middle")
    .style("font-size", "20px")
    .style("text-decoration", "underline")
    .text("Elbow Plot MSE & K");

  // Create the plotting area
  const chart = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top+10})`);

  // Scales
  const xScale = d3
    .scaleBand()
    .domain(mse.map((d, i) => i + 1))
    .range([0, width])
    .padding(0.2);
  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(mse)])
    .range([height, 0]);

  // X-axis
  chart
    .append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));

  // Y-axis
  chart.append("g").call(d3.axisLeft(yScale));

  // Plotting the bars
  const bars = chart.selectAll(".bar")
  .data(mse)
  .enter()
  .append("rect")
  .attr("class", "bar")
  .attr("x", (d, i) => xScale(i + 1))
  .attr("y", (d) => yScale(d))
  .attr("width", xScale.bandwidth())
  .attr("height", (d) => height - yScale(d))
  .attr("fill", (d, i) => (i === optimalK - 1 ? "green" : "steelblue")); // Initial color setting

    bars.on("mouseover", function (event, d, i) {
      if (d3.select(this).attr("fill") !== "green") {
        d3.select(this).transition().duration(100).attr("fill", "orange");
      }
    })
    .on("mouseout", function (event, d, i) {
      if (d3.select(this).attr("fill") !== "green") {
        d3.select(this).transition().duration(100).attr("fill", "steelblue");
      }
    })
    .on("click", function (event, d,i) {
        bars.classed("selected", false).attr("fill", "steelblue"); // Reset all bars
        d3.select(this).classed("selected", true).attr("fill", "green");
      // Use D3's select and datum to access the index
      const barNumber = mse.findIndex((mseValue) => mseValue === d) + 1;
      console.log("Bar clicked:", barNumber);
      fetch(`/biplot/${barNumber}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then((data) => {
          console.log("Success:", data);
          debugger
          // Here you can do something with the response if needed
          plotBiplot(data);
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    });

  // Plotting the line
  const line = d3
    .line()
    .x((d, i) => xScale(i + 1) + xScale.bandwidth() / 2) // Center the line in the bars
    .y((d) => yScale(d));

  chart
    .append("path")
    .datum(mse)
    .attr("fill", "none")
    .attr("stroke", "red")
    .attr("stroke-width", 2)
    .attr("d", line);

  // Optionally, add points for each elbow
  chart
    .selectAll(".dot")
    .data(mse)
    .enter()
    .append("circle")
    .attr("class", "dot")
    .attr("cx", (d, i) => xScale(i + 1) + xScale.bandwidth() / 2) // Center the dots on the bars
    .attr("cy", (d) => yScale(d))
    .attr("r", 5)
    .attr("fill", "red");

  // Highlight the optimal number of clusters
  chart
    .append("circle")
    .attr("class", "optimal-dot")
    .attr("cx", xScale(optimalK) + xScale.bandwidth() / 2)
    .attr("cy", yScale(mse[optimalK - 1]))
    .attr("r", 6)
    .attr("fill", "green");

  // X-axis label
  chart
    .append("text")
    .attr("transform", `translate(${width / 2}, ${height + margin.top+35})`)
    .style("text-anchor", "middle")
    .text("Number of Clusters (k)");

  // Y-axis label
  chart
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - height / 2)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("MSE");
}

function fetchMSE() {
  debugger;
  fetch("/calculate-mse")
    .then((response) => response.json())
    .then((data) => {
      const mse = data.mse;
      plotElbowGraph(mse); // Make sure plotElbowGraph is defined in your index.js
    })
    .catch((error) => console.error("Error fetching WCSS:", error));
}


function plotBiplot(data) {
    debugger
  // Define a color scale
  const { scores, loadings, explained_variance_ratio } = data;

  const color = d3.scaleOrdinal(d3.schemeCategory10); // This has 10 colors; you can use just the first 3


  // Clear any existing content
  d3.select("#plots").html("");
  const margin = { top: 50, right: 100, bottom: 70, left: 100 },
    width = 960 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

  const svg = d3
    .select("#plots")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Find the range of the data
  const xMin = d3.min(scores, (d) => d.PC1);
  const xMax = d3.max(scores, (d) => d.PC1);
  const yMin = d3.min(scores, (d) => d.PC2);
  const yMax = d3.max(scores, (d) => d.PC2);
  const x = d3
    .scaleLinear()
    .domain([xMin - 1, xMax]) // Adjust these values to "zoom in"
    .range([0, width]);
  const y = d3
    .scaleLinear()
    .domain([yMin, yMax]) // No change for y-axis
    .range([height, 0]);

  // Draw the x and y axes
  svg
    .append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).ticks((xMax - (xMin - 1)) / 0.5));
  svg.append("g").call(d3.axisLeft(y));

  svg
    .append("text")
    .attr("class", "graph-title")
    .attr("x", width / 2)
    .attr("y", 0 - margin.top / 2 + 10)
    .attr("text-anchor", "middle")
    .style("font-size", "20px")
    .style("text-decoration", "underline")
    .text("PCA-based Biplot");
  const lightColor = "#9a8cd1";
  const points = svg.selectAll(".point").data(scores);

  // Use the enter selection to add new points
  points
    .enter()
    .append("circle")
    .attr("class", "point")
    // Initialize the starting position and attributes for the transition
    .attr("cx", x(0))
    .attr("cy", y(0))
    .attr("r", 0) // Start with radius 0 to grow during the transition
    .merge(points) // Merge enter and update selections
    .transition() // Initialize the transition
    .delay((d, i) => i * 10) // Delay each point based on its index
    .duration(750) // Set the duration
    .attr("cx", (d) => x(d.PC1))
    .attr("cy", (d) => y(d.PC2))
    .attr("r", 6)
    .attr("fill", (d) => (isToggled ? lightColor : color(d.cluster)));

  // Use the exit selection to remove points that are no longer needed
  points
    .exit()
    .transition()
    .duration(1000)
    .attr("r", 0) // Shrink the points to disappear
    .remove();

  // Plot each score as a point
  svg
    .selectAll(".point")
    .data(scores)
    .enter()
    .append("circle")
    .attr("class", "point")
    .attr("cx", (d) => x(d.PC1))
    .attr("cy", (d) => y(d.PC2))
    .attr("r", 5)
    .attr("fill", (d) => color(d.cluster));

  // Plot each loading as a line
  svg
    .selectAll(".loading")
    .data(loadings)
    .enter()
    .append("line")
    .attr("class", "loading")
    .attr("x1", x(0)) // Start the line from x = -3.5
    .attr("y1", y(0))
    .attr("x2", (d) => x(d.PC1 * 7.5))
    .attr("y2", (d) => y(d.PC2 * 7.5))
    .attr("stroke", "black")
    .attr("stroke-width", 2);

  // Optionally, label the loadings
  svg
    .selectAll(".loading-label")
    .data(loadings)
    .enter()
    .append("text")
    .attr("class", "loading-label")
    .attr("x", (d) => x(d.PC1 * 7.5))
    .attr("y", (d) => y(d.PC2 * 7.5))
    .attr("stroke", "red")
    .text((d, i) => "Var" + (i + 1));

  svg
    .append("text")
    .attr("class", "x label")
    .attr("text-anchor", "end") // This ensures the text-anchor is at the end of the text
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 8) // Position just above the bottom of the SVG
    .text("Principal Component 1"); // The label for the x-axis

  // Y-axis label
  svg
    .append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("y", -margin.left + 50) // Position away from the y-axis
    .attr("x", -height / 2) // Center the text
    .attr("dy", ".75em") // Offset the text position
    .attr("transform", "rotate(-90)") // Rotate the text for y-axis
    .text("Principal Component 2"); // The label for the y-axisz

  // Sort the color domain to ensure the legend order is correct
  const sortedDomain = color.domain().sort(function (a, b) {
    return a - b;
  }); // This sorts numerically

  // Add legend
  const legend = svg
    .selectAll(".legend")
    .data(sortedDomain) // Use the sorted domain for the legend data
    .enter()
    .append("g")
    .attr("class", "legend")
    .attr("transform", function (d, i) {
      return "translate(0," + i * 20 + ")";
    });

  // Draw legend colored rectangles
  legend
    .append("rect")
    .attr("x", width - 18)
    .attr("width", 18)
    .attr("height", 18)
    .style("fill", color);

  // Draw legend text
  legend
    .append("text")
    .attr("x", width - 24)
    .attr("y", 9)
    .attr("dy", ".35em")
    .style("text-anchor", "end")
    .text(function (d) {
      return "Cluster " + d;
    });
}
