// Prediction Summary Chart Module
const PredictionSummaryChart = (function() {
  // Chart configuration
  const chartConfig = {
    margin: { top: 20, right: 30, bottom: 50, left: 60 },
    transitionDuration: 500,
    colors: {
      normal: "green",
      preFailure: "yellow",
      failure: "red",
      hover: {
        normal: "#4CAF50",    // Brighter green
        preFailure: "#FFC107", // Brighter yellow
        failure: "#FF5252"     // Brighter red
      },
      selectedDate: "#3498db" // Blue color for selected date (not used anymore)
    }
  };

  // Initialize the chart
  function initialize(elementId) {
    const container = document.getElementById(elementId);
    
    // Clear any existing chart
    container.innerHTML = "";
    
    // Return a reference to the container for later use
    return {
      elementId: elementId,
      container: container
    };
  }

  // Helper function to format duration
  function formatDuration(milliseconds) {
    // Convert milliseconds to minutes, hours, and days
    const totalMinutes = Math.floor(milliseconds / (1000 * 60));
    const totalHours = Math.floor(totalMinutes / 60);
    const totalDays = Math.floor(totalHours / 24);
    
    // Calculate remaining hours and minutes
    const remainingHours = totalHours % 24;
    const remainingMinutes = totalMinutes % 60;
    
    // Build the formatted string
    let result = "";
    if (totalDays > 0) {
      result += `${totalDays} day${totalDays !== 1 ? 's' : ''} `;
    }
    if (remainingHours > 0 || totalDays > 0) {
      result += `${remainingHours} hour${remainingHours !== 1 ? 's' : ''} `;
    }
    if (remainingMinutes > 0 || remainingHours > 0 || totalDays > 0) {
      result += `${remainingMinutes} min${remainingMinutes !== 1 ? 's' : ''}`;
    }
    
    return result.trim();
  }

  // Update the chart with new data and settings
  function update(chart, data, startDate, endDate) {
    if (!chart || !data) return;
    
    const container = chart.container;
    
    // Clear any existing chart
    container.innerHTML = "";
    
    const margin = chartConfig.margin;
    const width = container.clientWidth;
    const height = container.clientHeight || 400;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create SVG element
    const svg = d3
      .select(`#${chart.elementId}`)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Filter data by date range
    const filteredData = data.filter((d) => d.date >= startDate && d.date <= endDate);
    
    // Check if we have data after filtering
    if (filteredData.length === 0) {
      console.warn(`No data available for Prediction Summary with the selected date range`);
      svg.append("text")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight / 2)
        .attr("text-anchor", "middle")
        .text("No data available for selected date range");
      return;
    }

    // Create scales for the chart
    const xMin = d3.min(filteredData, d => d.date);
    const xMax = d3.max(filteredData, d => d.date);
    
    // Add padding to the right to ensure tooltips are visible for rightmost bars
    const rangePadding = (xMax.getTime() - xMin.getTime()) * 0.08; // 8% padding
    const xScale = d3
      .scaleTime()
      .domain([xMin, new Date(xMax.getTime() + rangePadding)])
      .range([0, innerWidth]);
    
    const yMax = d3.max(filteredData, (d) => d.y_prob) || 1;
    const yScale = d3.scaleLinear().domain([0, yMax]).range([innerHeight, 0]);

    // Create and add X and Y axes
    const xAxis = d3.axisBottom(xScale).ticks(7).tickFormat(d3.timeFormat("%Y-%m-%d"));
    svg
      .append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(xAxis)
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");

    const yAxis = d3.axisLeft(yScale).ticks(5);
    svg.append("g").call(yAxis);

    // Add X and Y axis labels
    svg
      .append("text")
      .attr("class", "x-label")
      .attr("text-anchor", "middle")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + margin.bottom - 5)
      .text("Date");

    svg
      .append("text")
      .attr("class", "y-label")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -margin.left + 15)
      .text("Failure Probability");

    // Create a reference to store which bar is currently highlighted
    let currentHighlightedBar = null;

    // Define color by classification
    const classificationColors = {
      "Normal": chartConfig.colors.normal,
      "Pre-Failure": chartConfig.colors.preFailure,
      "Failure": chartConfig.colors.failure
    };

    // Define hover color by classification
    const classificationHoverColors = {
      "Normal": chartConfig.colors.hover.normal,
      "Pre-Failure": chartConfig.colors.hover.preFailure,
      "Failure": chartConfig.colors.hover.failure
    };

    // Note: Removed the selected date vertical line and tooltip

    // Create tooltip
    const tooltip = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);

    // Predefined failure ranges with additional information
    const failureRanges = [
      {
        start: new Date("2020-04-18T00:00:00"),
        end: new Date("2020-04-18T23:59:00"),
        info: "Failure Range 1"
      },
      {
        start: new Date("2020-05-29T23:30:00"),
        end: new Date("2020-05-30T06:00:00"),
        info: "Failure Range 2"
      },
      {
        start: new Date("2020-06-05T10:00:00"),
        end: new Date("2020-06-07T14:30:00"),
        info: "Failure Range 3"
      },
      {
        start: new Date("2020-07-15T14:30:00"),
        end: new Date("2020-07-15T19:00:00"),
        info: "Failure Range 4"
      }
    ];

    // Draw the step fill visualization with interactive bars
    const barsGroup = svg.append("g").attr("class", "bars-group");

    // Handle mouse over on bars
    function handleBarMouseOver(d, i) {
      // Reset previous highlighted bar if exists
      if (currentHighlightedBar) {
        d3.select(currentHighlightedBar)
          .attr("fill", classificationColors[d3.select(currentHighlightedBar).datum().classification])
          .attr("stroke", "none")
          .attr("stroke-width", 0)
          .attr("transform", "");
      }
      
      // Highlight current bar
      d3.select(this)
        .attr("fill", classificationHoverColors[d.classification])
        .attr("stroke", "#333")
        .attr("stroke-width", 1)
        .attr("transform", "scale(1.1, 1.1)");
      
      // Update current highlighted bar reference
      currentHighlightedBar = this;
      
      // Show tooltip
      tooltip.style("opacity", 0.9);
    }

    // Handle mouse out on bars
    function handleBarMouseOut(d, i) {
      // Reset this bar
      d3.select(this)
        .attr("fill", classificationColors[d.classification])
        .attr("stroke", "none")
        .attr("stroke-width", 0)
        .attr("transform", "");
      
      // Clear current highlighted bar reference
      currentHighlightedBar = null;
      
      // Hide tooltip
      tooltip.style("opacity", 0);
    }

    // Handle mouse move on bars
    function handleBarMouseMove(d, i) {
      // Basic tooltip content
      let content = `<strong>Date:</strong> ${d3.timeFormat("%Y-%m-%d")(d.date)}<br/>
                    <strong>Probability:</strong> ${d3.format(".2f")(d.y_prob)}<br/>
                    <strong>Prediction:</strong> ${d.Prediction}<br/>
                    <strong>Actual:</strong> ${d.actual}<br/>
                    <strong>Operations:</strong> ${d.classification}`;

      // Add failure-specific information if applicable
      if (d.classification === "Failure") {
        let failureDetail = failureRanges.find(
          (r) => d.date >= r.start && d.date <= r.end
        );
        
        if (failureDetail) {
          const duration = formatDuration(failureDetail.end - failureDetail.start);
              
          content += `<br/><strong>Failure Range:</strong> ${d3.timeFormat("%Y-%m-%d %H:%M")(failureDetail.start)}
                      - ${d3.timeFormat("%Y-%m-%d %H:%M")(failureDetail.end)}<br/>
                      <strong>Duration:</strong> ${duration}`;
        }
      }

      // Position and update the tooltip
      tooltip
        .html(content)
        .style("left", (d3.event.pageX + 10) + "px")
        .style("top", (d3.event.pageY - 28) + "px");
    }

    // For single data point handling
    if (filteredData.length === 1) {
      const p = filteredData[0];
      const rectWidth = 2;
      const xCenter = xScale(p.date);
      const yTop = yScale(p.y_prob);
      const yBottom = yScale(0);
      
      barsGroup.append("rect")
        .datum(p)
        .attr("x", xCenter - rectWidth/2)
        .attr("y", yTop)
        .attr("width", rectWidth)
        .attr("height", yBottom - yTop)
        .attr("fill", classificationColors[p.classification] || "gray")
        .attr("stroke", "none")
        .attr("stroke-width", 0)
        .on("mouseover", handleBarMouseOver)
        .on("mouseout", handleBarMouseOut)
        .on("mousemove", handleBarMouseMove);
    } else {
      // Calculate average time between data points to determine consistent bar width
      let totalTimeDiff = 0;
      let countTimeDiff = 0;
      for (let i = 1; i < filteredData.length; i++) {
        totalTimeDiff += filteredData[i].date.getTime() - filteredData[i-1].date.getTime();
        countTimeDiff++;
      }
      const avgTimeDiff = countTimeDiff > 0 ? totalTimeDiff / countTimeDiff : 24 * 60 * 60 * 1000; // Default to 1 day
      
      // Draw rectangles for each data point
      for (let i = 0; i < filteredData.length; i++) {
        const d = filteredData[i];

        // Calculate left and right boundaries with consistent width
        let leftDate, rightDate;
        
        if (i === 0) {
          // First point - set a full-width bar that doesn't overlap the axis
          leftDate = d.date;
          
          // For the first bar, make its width match the average width of other bars
          // by extending it fully to the right
          if (filteredData.length > 1) {
            // Calculate the average width based on other bars
            const nextPoint = filteredData[1];
            // Make the width equal to the full average bar width
            rightDate = new Date(d.date.getTime() + avgTimeDiff);
          } else {
            // Default to one day if there's only one point
            rightDate = new Date(d.date.getTime() + (24 * 60 * 60 * 1000));
          }
        } else if (i === filteredData.length - 1) {
          // Last point - extend right by half the average difference
          leftDate = new Date(d.date.getTime() - avgTimeDiff/2);
          rightDate = new Date(d.date.getTime() + avgTimeDiff/2);
        } else {
          // Middle points - use midpoints between data points
          const prevDate = filteredData[i - 1].date;
          const nextDate = filteredData[i + 1].date;
          leftDate = new Date((d.date.getTime() + prevDate.getTime()) / 2);
          rightDate = new Date((d.date.getTime() + nextDate.getTime()) / 2);
        }

        const xLeft = xScale(leftDate);
        const xRight = xScale(rightDate);
        const yTop = yScale(d.y_prob);
        const yBottom = yScale(0);
        const barWidth = xRight - xLeft;

        // Create a rectangle for each bar
        barsGroup.append("rect")
          .datum(d)
          .attr("class", "probability-bar")
          .attr("x", xLeft)
          .attr("y", yTop)
          .attr("width", barWidth)
          .attr("height", yBottom - yTop)
          .attr("fill", classificationColors[d.classification] || "gray")
          .style("transform-origin", `${xLeft + barWidth/2}px ${yTop + (yBottom-yTop)/2}px`)
          .on("mouseover", handleBarMouseOver)
          .on("mouseout", handleBarMouseOut)
          .on("mousemove", handleBarMouseMove);
      }
    }

    // Add legend - moved to the left side
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(10, 10)`); // Positioned at top-left

    const legendItems = [
      { label: "Normal", color: chartConfig.colors.normal, type: "fill" },
      { label: "Pre-Failure", color: chartConfig.colors.preFailure, type: "fill" },
      { label: "Failure", color: chartConfig.colors.failure, type: "fill" }
      // Removed "Selected Date" from legend
    ];

    legendItems.forEach((item, i) => {
      const legendItem = legend.append("g").attr("transform", `translate(0, ${i * 20})`);

      if (item.type === "line") {
        legendItem
          .append("line")
          .attr("x1", 0)
          .attr("x2", 20)
          .attr("y1", 10)
          .attr("y2", 10)
          .attr("stroke", item.color)
          .attr("stroke-width", 2);
      } else if (item.type === "fill") {
        legendItem
          .append("rect")
          .attr("width", 20)
          .attr("height", 10)
          .attr("y", 5)
          .attr("fill", item.color);
      }

      legendItem
        .append("text")
        .attr("x", 25)
        .attr("y", 10)
        .attr("dy", "0.35em")
        .attr("font-size", "12px")
        .text(item.label);
    });
  }

  // Public API
  return {
    initialize,
    update
  };
})();