// DV Pressure Chart Module
const DVPressureChart = (function() {
  // Chart configuration
  const chartConfig = {
    margin: { top: 20, right: 30, bottom: 90, left: 60 }, // Reduced right margin
    transitionDuration: 500,
    colors: {
      line: "#1f77b4",
      mean: "#2ca02c",
      ucl1: "#ff7f0e",
      lcl1: "#ff7f0e",
      ucl2: "#9467bd",
      lcl2: "#9467bd",
      ucl3: "#d62728",
      lcl3: "#d62728"
      // Removed selectedDate color
    },
  };

  // Initialize the chart
  function initialize(elementId) {
    const chartElement = document.getElementById(elementId);

    // Clear any existing chart
    chartElement.innerHTML = "";

    // Calculate dimensions
    const width = chartElement.clientWidth;
    const height = chartElement.clientHeight || 400; // Default height if not set
    const innerWidth = width - chartConfig.margin.left - chartConfig.margin.right;
    // Add more bottom margin to accommodate slanted text
    const innerHeight = height - chartConfig.margin.top - (chartConfig.margin.bottom + 15);

    // Create SVG element
    const svg = d3
      .select(`#${elementId}`)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${chartConfig.margin.left},${chartConfig.margin.top})`);

    // Add clip path for the chart area
    svg
      .append("defs")
      .append("clipPath")
      .attr("id", `clip-${elementId}`)
      .append("rect")
      .attr("width", innerWidth)
      .attr("height", innerHeight);

    // Add X and Y axes groups
    const xAxis = svg.append("g").attr("class", "x axis").attr("transform", `translate(0,${innerHeight})`);

    const yAxis = svg.append("g").attr("class", "y axis");

    // Add X and Y axis labels
    svg
      .append("text")
      .attr("class", "x-label")
      .attr("text-anchor", "middle")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + chartConfig.margin.bottom - 5) // Move further down
      .text("Date");

    svg
      .append("text")
      .attr("class", "y-label")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -chartConfig.margin.left + 15)
      .text("DV Pressure");

    // Add grid lines
    const xGrid = svg.append("g").attr("class", "grid").attr("transform", `translate(0,${innerHeight})`);

    const yGrid = svg.append("g").attr("class", "grid");

    // Create a group for the chart elements
    const chartGroup = svg.append("g").attr("clip-path", `url(#clip-${elementId})`);

    // Lines for control limits and mean
    const meanLine = chartGroup
      .append("path")
      .attr("class", "mean-line")
      .attr("stroke", chartConfig.colors.mean)
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5")
      .attr("fill", "none");

    const ucl1Line = chartGroup
      .append("path")
      .attr("class", "ucl-line")
      .attr("stroke", chartConfig.colors.ucl1)
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "5,5")
      .attr("fill", "none");

    const lcl1Line = chartGroup
      .append("path")
      .attr("class", "lcl-line")
      .attr("stroke", chartConfig.colors.lcl1)
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "5,5")
      .attr("fill", "none");

    const ucl2Line = chartGroup
      .append("path")
      .attr("class", "ucl-line")
      .attr("stroke", chartConfig.colors.ucl2)
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "5,5")
      .attr("fill", "none");

    const lcl2Line = chartGroup
      .append("path")
      .attr("class", "lcl-line")
      .attr("stroke", chartConfig.colors.lcl2)
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "5,5")
      .attr("fill", "none");

    const ucl3Line = chartGroup
      .append("path")
      .attr("class", "ucl-line")
      .attr("stroke", chartConfig.colors.ucl3)
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "5,5")
      .attr("fill", "none");

    const lcl3Line = chartGroup
      .append("path")
      .attr("class", "lcl-line")
      .attr("stroke", chartConfig.colors.lcl3)
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "5,5")
      .attr("fill", "none");

    // Add path for the data line
    const dataLine = chartGroup
      .append("path")
      .attr("class", "line")
      .attr("fill", "none")
      .attr("stroke", chartConfig.colors.line)
      .attr("stroke-width", 2);

    // Points for the data
    const points = chartGroup.append("g").attr("class", "data-points");

    // Create tooltip
    const tooltip = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);

    // Legend - positioned at top for horizontal layout
    const legend = svg
      .append("g")
      .attr("class", "legend")
      .attr("transform", `translate(0, -5)`); // Position at top, without x offset initially

    // Store the chart elements for later updating
    return {
      svg,
      xAxis,
      yAxis,
      xGrid,
      yGrid,
      meanLine,
      ucl1Line,
      lcl1Line,
      ucl2Line,
      lcl2Line,
      ucl3Line,
      lcl3Line,
      dataLine,
      points,
      tooltip,
      legend,
      width,
      height,
      innerWidth,
      innerHeight,
      chartGroup,
      elementId
    };
  }

  // Update the chart with new data and settings
  function update(chart, data, selectedMonth, sigmaLevel, startDate, endDate) {
    if (!chart || !data) return;

    // Filter data by date range
    let filteredData = data.filter(d => d.date >= startDate && d.date <= endDate);
    
    // Further filter by month if specified
    if (selectedMonth !== "all") {
      const monthNum = parseInt(selectedMonth);
      filteredData = filteredData.filter((row) => {
        if (row.month !== undefined) {
          return row.month === monthNum;
        } else if (row.date && row.date instanceof Date) {
          return row.date.getMonth() + 1 === monthNum; // JS months are 0-based
        }
        return false;
      });
    }

    // Check if we have data after filtering
    if (filteredData.length === 0) {
      console.warn(`No data available for DV Pressure with the selected filters`);
      return;
    }

    // Create scales without extra padding
    const xMin = d3.min(filteredData, d => d.date);
    const xMax = d3.max(filteredData, d => d.date);
    
    // No extra padding
    const xScale = d3
      .scaleTime()
      .domain([xMin, xMax])
      .range([0, chart.innerWidth]);

    // Find max value for y-scale, considering data points and upper control limits
    const dataMax = d3.max(filteredData, (d) => d.DV_pressure);
    const uclMax = d3.max(filteredData, (d) => d.ucl_3 || d.ucl_2 || d.ucl_1 || 0);
    const yMax = Math.max(dataMax, uclMax) * 1.1; // Add 10% padding

    // Find min value for y-scale, considering data points and lower control limits
    const dataMin = d3.min(filteredData, (d) => d.DV_pressure);
    const lclMin = d3.min(filteredData, (d) => d.lcl_3 || d.lcl_2 || d.lcl_1 || 0);
    const yMin = Math.min(dataMin, lclMin) * 0.9; // Add 10% padding

    const yScale = d3.scaleLinear().domain([yMin, yMax]).range([chart.innerHeight, 0]);

    // Update axes with slanted text for dates
    chart.xAxis
      .transition()
      .duration(chartConfig.transitionDuration)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(7) // Reduce number of ticks to avoid overcrowding
          .tickFormat(d3.timeFormat("%Y-%m-%d"))
      )
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)"); // Rotate text to avoid overlap

    chart.yAxis.transition().duration(chartConfig.transitionDuration).call(d3.axisLeft(yScale));

    // Update grid lines
    chart.xGrid
      .transition()
      .duration(chartConfig.transitionDuration)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(7)
          .tickSize(-chart.innerHeight)
          .tickFormat("")
      )
      .call((g) => g.select(".domain").remove());

    chart.yGrid
      .transition()
      .duration(chartConfig.transitionDuration)
      .call(d3.axisLeft(yScale).tickSize(-chart.innerWidth).tickFormat(""))
      .call((g) => g.select(".domain").remove());

    // Line generators
    const lineGenerator = d3
      .line()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.DV_pressure))
      .curve(d3.curveMonotoneX);

    // Update data line
    chart.dataLine
      .datum(filteredData)
      .transition()
      .duration(chartConfig.transitionDuration)
      .attr("d", lineGenerator);

    // Update mean line
    chart.meanLine
      .datum(filteredData)
      .transition()
      .duration(chartConfig.transitionDuration)
      .attr(
        "d",
        d3
          .line()
          .x((d) => xScale(d.date))
          .y((d) => yScale(d.monthly_mean || d.cumulative_mean))
          .curve(d3.curveMonotoneX)
      );

    // Update control limit lines based on selected sigma level
    if (sigmaLevel >= 1) {
      chart.ucl1Line
        .datum(filteredData)
        .transition()
        .duration(chartConfig.transitionDuration)
        .attr(
          "d",
          d3
            .line()
            .x((d) => xScale(d.date))
            .y((d) => yScale(d.ucl_1))
            .curve(d3.curveMonotoneX)
        );

      chart.lcl1Line
        .datum(filteredData)
        .transition()
        .duration(chartConfig.transitionDuration)
        .attr(
          "d",
          d3
            .line()
            .x((d) => xScale(d.date))
            .y((d) => yScale(d.lcl_1))
            .curve(d3.curveMonotoneX)
        );

      chart.ucl1Line.style("opacity", 1);
      chart.lcl1Line.style("opacity", 1);
    } else {
      chart.ucl1Line.style("opacity", 0);
      chart.lcl1Line.style("opacity", 0);
    }

    if (sigmaLevel >= 2) {
      chart.ucl2Line
        .datum(filteredData)
        .transition()
        .duration(chartConfig.transitionDuration)
        .attr(
          "d",
          d3
            .line()
            .x((d) => xScale(d.date))
            .y((d) => yScale(d.ucl_2))
            .curve(d3.curveMonotoneX)
        );

      chart.lcl2Line
        .datum(filteredData)
        .transition()
        .duration(chartConfig.transitionDuration)
        .attr(
          "d",
          d3
            .line()
            .x((d) => xScale(d.date))
            .y((d) => yScale(d.lcl_2))
            .curve(d3.curveMonotoneX)
        );

      chart.ucl2Line.style("opacity", 1);
      chart.lcl2Line.style("opacity", 1);
    } else {
      chart.ucl2Line.style("opacity", 0);
      chart.lcl2Line.style("opacity", 0);
    }

    if (sigmaLevel >= 3) {
      chart.ucl3Line
        .datum(filteredData)
        .transition()
        .duration(chartConfig.transitionDuration)
        .attr(
          "d",
          d3
            .line()
            .x((d) => xScale(d.date))
            .y((d) => yScale(d.ucl_3))
            .curve(d3.curveMonotoneX)
        );

      chart.lcl3Line
        .datum(filteredData)
        .transition()
        .duration(chartConfig.transitionDuration)
        .attr(
          "d",
          d3
            .line()
            .x((d) => xScale(d.date))
            .y((d) => yScale(d.lcl_3))
            .curve(d3.curveMonotoneX)
        );

      chart.ucl3Line.style("opacity", 1);
      chart.lcl3Line.style("opacity", 1);
    } else {
      chart.ucl3Line.style("opacity", 0);
      chart.lcl3Line.style("opacity", 0);
    }

    // Update data points
    const pointSelection = chart.points.selectAll("circle").data(filteredData);

    pointSelection.exit().remove();

    pointSelection
      .enter()
      .append("circle")
      .attr("r", 3.5)
      .attr("fill", chartConfig.colors.line)
      .merge(pointSelection)
      .transition()
      .duration(chartConfig.transitionDuration)
      .attr("cx", (d) => xScale(d.date))
      .attr("cy", (d) => yScale(d.DV_pressure));

    // Update legend - moved to below title and laid out horizontally
    chart.legend.selectAll("*").remove();

    const legendItems = [
      { label: "Daily Value", color: chartConfig.colors.line, type: "line" },
      { label: "Mean", color: chartConfig.colors.mean, type: "dashed" },
    ];

    if (sigmaLevel >= 1) {
      legendItems.push({ label: "±1σ", color: chartConfig.colors.ucl1, type: "dashed" });
    }

    if (sigmaLevel >= 2) {
      legendItems.push({ label: "±2σ", color: chartConfig.colors.ucl2, type: "dashed" });
    }

    if (sigmaLevel >= 3) {
      legendItems.push({ label: "±3σ", color: chartConfig.colors.ucl3, type: "dashed" });
    }

    // Calculate total width needed for all legend items
    const itemWidth = 80; // Width allocated for each legend item
    const totalWidth = legendItems.length * itemWidth;
    
    // Position the entire legend group at the center of the chart
    chart.legend.attr("transform", `translate(${(chart.innerWidth - totalWidth) / 2}, -5)`);

    // Add each legend item with horizontal layout
    legendItems.forEach((item, i) => {
      const legendItem = chart.legend.append("g").attr("transform", `translate(${i * itemWidth}, 0)`);

      if (item.type === "line") {
        legendItem
          .append("line")
          .attr("x1", 0)
          .attr("x2", 20)
          .attr("y1", 10)
          .attr("y2", 10)
          .attr("stroke", item.color)
          .attr("stroke-width", 2);

        legendItem.append("circle").attr("cx", 10).attr("cy", 10).attr("r", 3.5).attr("fill", item.color);
      } else if (item.type === "dashed") {
        legendItem
          .append("line")
          .attr("x1", 0)
          .attr("x2", 20)
          .attr("y1", 10)
          .attr("y2", 10)
          .attr("stroke", item.color)
          .attr("stroke-width", 1.5)
          .attr("stroke-dasharray", "5,5");
      }

      legendItem
        .append("text")
        .attr("x", 25)
        .attr("y", 10)
        .attr("dy", "0.35em")
        .attr("font-size", "12px")
        .text(item.label);
    });

    // Add interactive features
    addInteractiveFeatures(chart, filteredData, xScale, yScale);
  }

  // Add interactive tooltip features
  function addInteractiveFeatures(chart, data, xScale, yScale) {
    // Remove any existing overlay
    chart.chartGroup.selectAll(".overlay").remove();
    chart.chartGroup.selectAll(".tooltip-line").remove();
    chart.chartGroup.selectAll(".tooltip-circle").remove();

    const overlay = chart.chartGroup
      .append("rect")
      .attr("class", "overlay")
      .attr("width", chart.innerWidth)
      .attr("height", chart.innerHeight)
      .style("fill", "none")
      .style("pointer-events", "all");

    const verticalLine = chart.chartGroup
      .append("line")
      .attr("class", "tooltip-line")
      .attr("y1", 0)
      .attr("y2", chart.innerHeight)
      .style("opacity", 0);

    const tooltipCircle = chart.chartGroup
      .append("circle")
      .attr("class", "tooltip-circle")
      .attr("r", 5)
      .style("fill", chartConfig.colors.line)
      .style("stroke", "#fff")
      .style("stroke-width", 2)
      .style("opacity", 0);

    overlay
      .on("mouseover", function() {
        chart.tooltip.style("opacity", 0.9);
        verticalLine.style("opacity", 1);
        tooltipCircle.style("opacity", 1);
      })
      .on("mouseout", function() {
        chart.tooltip.style("opacity", 0);
        verticalLine.style("opacity", 0);
        tooltipCircle.style("opacity", 0);
      })
      .on("mousemove", function() {
        const mouseX = d3.mouse(this)[0];
        const x0 = xScale.invert(mouseX);

        const bisect = d3.bisector((d) => d.date).left;
        const index = bisect(data, x0, 1);

        if (index >= data.length) return;

        const d0 = data[index - 1];
        const d1 = data[index];

        if (!d0 || !d1) return;

        const d = x0 - d0.date > d1.date - x0 ? d1 : d0;

        const xPos = xScale(d.date);
        const yPos = yScale(d.DV_pressure);

        verticalLine.attr("x1", xPos).attr("x2", xPos);

        tooltipCircle.attr("cx", xPos).attr("cy", yPos);

        const formatDate = d3.timeFormat("%Y-%m-%d");
        const formatValue = d3.format(",.2f");
        
        // Handle both naming conventions
        const mean = d.monthly_mean !== undefined ? d.monthly_mean : d.cumulative_mean;
        const stdDev = d.monthly_std_dev !== undefined ? d.monthly_std_dev : d.cumulative_std_dev;

        chart.tooltip
          .html(
            `<strong>DV Pressure</strong><br/>
                       Date: ${formatDate(d.date)}<br/>
                       Value: ${formatValue(d.DV_pressure)}<br/>
                       Mean: ${formatValue(mean)}<br/>
                       Std Dev: ${formatValue(stdDev)}`
          )
          .style("left", d3.event.pageX + 10 + "px")
          .style("top", d3.event.pageY - 28 + "px");
      });
  }

  // Public API
  return {
    initialize,
    update
  };
})();