function createPCASummaryTable(pcaData,selectedPC = 15) {
    // Clear previous table content
    const container = d3.select("#pcaDetailsTableContainer");
    container.html("");
    selectedPC = selectedPC<pcaData.length ? selectedPC: pcaData.length;
    pcaData = pcaData[pcaData.length - 1];
    document.getElementById('elbowPlot').innerHTML = '';

    // Create the table structure
    // Inside the createPCASummaryTable function
    const table = container.append("table").attr("class", "pca-details-table");
  
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
        row.attr('class', 'highlight'); // Add a class to highlight the row
    }

      row.append("td").text(attribute); // First column with the attribute name
  
      // Add columns for each principal component's loading
      for (let pcIndex = 1; pcIndex <= selectedPC; pcIndex++) {
        const value = pcaData[pcIndex][attrIndex + 1]; // Offset by 1 due to header
        row
          .append("td")
          .text(typeof value === "number" ? value.toFixed(4) : value);
      }
  
      // Add column for squared sum
      const squaredSumValue = pcaData[pcaData.length-1][attrIndex + 1]; // Squared sum is the last array
      row
        .append("td")
        .text(
          typeof squaredSumValue === "number"
            ? squaredSumValue.toFixed(4)
            : squaredSumValue
        );
    });
  }
  
  function createCombinedGraph(varianceExplained, cumulativeVariance) {
      // Assuming varianceExplained and cumulativeVariance are already in percentage form.
      // If not, multiply each by 100.

      const data = varianceExplained.map((ve, i) => ({
          component: i + 1,
          variance: ve * 100, // Convert to percentage if necessary
          cumulative: cumulativeVariance[i] * 100 // Convert to percentage if necessary
      }));
  
      // Set dimensions and margins
      const margin = { top: 30, right: 30, bottom: 70, left: 60 },
            width = 960 - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom;
  
      // Remove any existing graph before drawing a new one
      d3.select("#combinedPlot").select("svg").remove();
  
      // Append SVG object to the body
      const svg = d3.select("#combinedPlot")
        .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);
  
      // X axis - Principal Components
      const x = d3.scaleBand()
        .range([0, width])
        .domain(data.map(d => d.component))
        .padding(0.2);
      svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));
  
      // Y axis - Percentage of Variance
      const y = d3.scaleLinear()
        .domain([0, 100]) // Assuming the scale from 0 to 100% for both variance and cumulative variance
        .range([height, 0]);
      svg.append("g")
        .call(d3.axisLeft(y));
  
      // Bars for Variance Explained
      svg.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
          .attr("class", "bar")
          .attr("class", d => `bar pc-${d.component}`) // Assign class based on component
          .attr("x", d => x(d.component))
          .attr("y", d => y(d.variance))
          .attr("width", x.bandwidth())
          .attr("height", d => height - y(d.variance))
          .attr("fill", "#69b3a2");
  
  
             // X axis label
      svg.append("text")             
      .attr("transform", `translate(${width / 2}, ${height + margin.top + 20})`) // Positioning the X-axis label
      .style("text-anchor", "middle")
      .text("Principal Components");
  
    // Y axis label
    svg.append("text")
      .attr("transform", "rotate(-90)") // Rotating the text for the Y-axis label
      .attr("y", 0 - margin.left) // Positioning based on the margin
      .attr("x",0 - (height / 2))
      .attr("dy", "1em") // Adjusting the distance from the axis
      .style("text-anchor", "middle")
      .text("% of Variance Explained");
  
  
      // Line for Cumulative Variance
      const line = d3.line()
          .x(d => x(d.component) + x.bandwidth() / 2) // Center the line in the middle of the band
          .y(d => y(d.cumulative)); // Use the y scale for cumulative variance
  
      // Draw the line
      svg.append("path")
          .datum(data)
          .attr("fill", "none")
          .attr("stroke", "steelblue")
          .attr("stroke-width", 1.5)
          .attr("d", line);
  
      // Optionally, add dots for each cumulative variance point
      svg.selectAll(".dot")
          .data(data)
          .enter().append("circle")
          .attr("class", "dot")
          .attr("cx", d => x(d.component) + x.bandwidth() / 2)
          .attr("cy", d => y(d.cumulative))
          .attr("r", 5)
          .attr("fill", "red")
          .on("click", function(event, d) {
              // Call createPCASummaryTable with the selected PC component number
              updateTableForSelectedComponent(d.component);
          })
          .on("mouseover", function(event, d) {
              // Highlight the corresponding bar by changing its color
              d3.selectAll(`.bar.pc-${d.component}`).attr("fill", "orange");
      
              // Change the dot's color to indicate it's being hovered over
              d3.select(this).attr("fill", "yellow"); // Change dot color on hover
          })
          // Add mouseout event
          .on("mouseout", function(event, d) {
              // Revert the bar color back to its original
              d3.selectAll(`.bar.pc-${d.component}`).attr("fill", "#69b3a2");
      
              // Revert the dot's color back to red
              d3.select(this).attr("fill", "red"); // Revert dot color when not hovering
          })
  }
  
  function updateTableForSelectedComponent(selectedComponent) {
      fetch(`/pca-data/${selectedComponent}`)
          .then(response => response.json())
          .then(data => {
              createPCASummaryTable(data, selectedComponent);
          })
          .catch(error => console.error('Error fetching PCA data:', error));
  }

function plotBiplot(scores, loadings) {
    // Define a color scale
    const color = d3.scaleOrdinal(d3.schemeCategory10);  // This has 10 colors; you can use just the first 3

    // Clear any existing content
    d3.select('#plots').html('');
debugger
    const margin = {top: 20, right: 20, bottom: 30, left: 50},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    const svg = d3.select("#plots").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Define the scales
    const x = d3.scaleLinear().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);

    // Compute the bounds of the dataset, then the domain of the scales
    x.domain(d3.extent(scores, d => d.PC1)).nice();
    y.domain(d3.extent(scores, d => d.PC2)).nice();

    // Draw the x and y axes
    svg.append("g").attr("transform", "translate(0," + height + ")").call(d3.axisBottom(x));
    svg.append("g").call(d3.axisLeft(y));

    // Plot each score as a point
    svg.selectAll(".point")
        .data(scores)
      .enter().append("circle")
        .attr("class", "point")
        .attr("cx", d => x(d.PC1))
        .attr("cy", d => y(d.PC2))
        .attr("r", 5)
        .attr("fill", "#7570b3")
        .attr("fill", d => color(d.cluster));
    // Plot each loading as a line
    svg.selectAll(".loading")
        .data(loadings)
      .enter().append("line")
        .attr("class", "loading")
        .attr("x1", x(0))
        .attr("y1", y(0))
        .attr("x2", d => x(d.PC1))
        .attr("y2", d => y(d.PC2))
        .attr("stroke", "red")
        .attr("stroke-width", 3);  

    // Optionally, label the loadings
    svg.selectAll(".loading-label")
        .data(loadings)
        .enter().append("text")
        .attr("class", "loading-label")
        .attr("x", d => x(d.PC1))
        .attr("y", d => y(d.PC2))
        .text((d, i) => "Var" + (i+1));

        
}

// Assuming 'data_for_plot.scores' and 'data_for_plot.loadings' are available
// plotBiplot(data_for_plot.scores, data_for_plot.loadings);




  function plotElbowGraph(wcss) {
    const svgWidth = 600, svgHeight = 400;
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const width = svgWidth - margin.left - margin.right;
    const height = svgHeight - margin.top - margin.bottom;
    const optimalK = 4;
    document.getElementById('elbowPlot').innerHTML = '';

    document.getElementById('combinedPlot').innerHTML = '';
    document.getElementById('pcaDetailsTableContainer').innerHTML = '';

    // Create SVG container
    const svg = d3.select('#elbowPlot')
        .append('svg')
        .attr('width', svgWidth)
        .attr('height', svgHeight);
        svg.html("");

    // Create the plotting area
    const chart = svg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Scales
    const xScale = d3.scaleLinear().domain([1, wcss.length]).range([0, width]);
    const yScale = d3.scaleLinear().domain([0, 100]).range([height, 0]);

    // X-axis
    chart.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(xScale).ticks(wcss.length))

    // Y-axis
    chart.append('g')
        .call(d3.axisLeft(yScale))

    // Plotting the line
    const line = d3.line()
        .x((d, i) => xScale(i + 1))
        .y(d => yScale(d));

    chart.append('path')
        .data([wcss])
        .attr('fill', 'none')
        .attr('stroke', 'blue')
        .attr('stroke-width', 2)
        .attr('d', line);

    // Optionally, add points for each elbow
    chart.selectAll('.dot')
        .data(wcss)
        .enter().append('circle')
        .attr('class', 'dot')
        .attr('cx', (d, i) => xScale(i + 1))
        .attr('cy', d => yScale(d))
        .attr('r', 5)
        .attr('fill', 'red')
        .on('mouseover', function(event, d) {
            // Show tooltip on hover
            d3.select(this).append('title').text(`WCSS: ${d}`);
        });

        chart.selectAll('.optimal-dot')
        .data([wcss[optimalK - 1]]) // Using optimalK - 1 because array index is zero-based
        .enter().append('circle')
        .attr('class', 'optimal-dot')
        .attr('cx', xScale(optimalK))
        .attr('cy', yScale(wcss[optimalK - 1]))
        .attr('r', 5)
        .attr('fill', 'green') // Different color for the optimal point

    // Optionally, label the optimal point
    chart.append('text')
        .attr('x', xScale(optimalK))
        .attr('y', yScale(wcss[optimalK - 1]) - 10)
        .attr('text-anchor', 'middle')

    // X-axis label
    chart.append('text')
        .attr('transform', `translate(${width / 2}, ${height + margin.top + 20})`)
        .style('text-anchor', 'middle')
        .text('Number of Clusters (k)');

    // Y-axis label
    chart.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 0 - margin.left)
        .attr('x', 0 - (height / 2))
        .attr('dy', '1em')
        .style('text-anchor', 'middle')
        .text('Objective function');
}

// Example WCSS data

// Assuming you have an element with id 'elbowPlot' in your HTML

  function fetchWCSS() {
    fetch('/calculate-wcss')
        .then(response => response.json())
        .then(data => {
            const wcss = data.wcss;
            plotElbowGraph(wcss); // Make sure plotElbowGraph is defined in your index.js
        })
        .catch(error => console.error('Error fetching WCSS:', error));
}
