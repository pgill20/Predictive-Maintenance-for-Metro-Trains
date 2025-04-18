// Main controller for the dashboard
// Global state management
const dashboardState = {
  // Datasets
  datasetDVPressure: null,
  datasetOilTemp: null,
  finalModelOutputData: null,
  
  // Date range controls
  startDate: new Date("2020-02-01"),
  endMonth: null,
  endDay: null,
  endDate: null,
  
  // Default values for removed controls
  selectedMonth: "all",
  sigmaLevel: 3,
  
  // Chart instances
  charts: {
    dvPressure: null,
    oilTemperature: null,
    predictionSummary: null
  },
  
  // Update the end date based on selected values
  updateEndDate() {
    this.endMonth = parseInt(document.getElementById("end-month-select").value);
    this.endDay = parseInt(document.getElementById("end-day-select").value);
    this.endDate = new Date(2020, this.endMonth - 1, this.endDay);
    return this.endDate;
  }
};

// Initialize the dashboard on page load
document.addEventListener("DOMContentLoaded", function() {
  setupEventListeners();
  loadDataFiles();
  
  // Initialize binary data display
  if (typeof BinaryDataDisplay !== 'undefined') {
    BinaryDataDisplay.initialize();
  }
  
  // Initialize dynamic tooltips
  setupDynamicTooltips();
});

// Setup dynamic tooltips
function setupDynamicTooltips() {
  // Find all help icons, including the new title-help-icon
  const helpIcons = document.querySelectorAll('.help-icon, .control-help-icon, .chart-help-icon, .title-help-icon');
  
  // Add mouseover event listeners to position tooltips dynamically
  helpIcons.forEach(icon => {
    icon.addEventListener('mouseover', function(event) {
      // Store tooltip text
      const tooltipText = this.getAttribute('title');
      
      // Remove title attribute to prevent browser's default tooltip
      this.setAttribute('data-title', tooltipText);
      this.removeAttribute('title');
      
      // Create tooltip element if it doesn't exist
      let tooltip = document.getElementById('dynamic-tooltip');
      if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'dynamic-tooltip';
        tooltip.style.position = 'fixed';
        tooltip.style.backgroundColor = 'rgba(25, 118, 210, 0.9)';
        tooltip.style.color = 'white';
        tooltip.style.padding = '8px 12px';
        tooltip.style.borderRadius = '4px';
        tooltip.style.fontSize = '12px';
        tooltip.style.maxWidth = '250px';
        tooltip.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
        tooltip.style.zIndex = '99999';
        tooltip.style.pointerEvents = 'none';
        document.body.appendChild(tooltip);
      }
      
      // Position tooltip based on icon type
      tooltip.textContent = tooltipText;
      
      // For title help icon, position below the cursor
      if (this.classList.contains('title-help-icon')) {
        tooltip.style.left = (event.clientX - tooltip.offsetWidth / 2) + 'px';
        tooltip.style.top = (event.clientY + 25) + 'px'; // Position below cursor
      } else {
        // For other icons, position above the cursor (default behavior)
        tooltip.style.left = (event.clientX - tooltip.offsetWidth / 2) + 'px';
        tooltip.style.top = (event.clientY - tooltip.offsetHeight - 10) + 'px';
      }
      
      tooltip.style.display = 'block';
      
      // Add mousemove event to update position
      const moveHandler = function(e) {
        // For title help icon, position below the cursor
        if (this.classList.contains('title-help-icon')) {
          tooltip.style.left = (e.clientX - tooltip.offsetWidth / 2) + 'px';
          tooltip.style.top = (e.clientY + 25) + 'px'; // Position below cursor
        } else {
          // For other icons, position above the cursor
          tooltip.style.left = (e.clientX - tooltip.offsetWidth / 2) + 'px';
          tooltip.style.top = (e.clientY - tooltip.offsetHeight - 10) + 'px';
        }
      };
      
      // Add mouseout event to hide tooltip
      const outHandler = function() {
        tooltip.style.display = 'none';
        // Restore title attribute
        this.setAttribute('title', this.getAttribute('data-title'));
        this.removeAttribute('data-title');
        // Remove event listeners
        this.removeEventListener('mousemove', moveHandler);
        this.removeEventListener('mouseout', outHandler);
      };
      
      this.addEventListener('mousemove', moveHandler);
      this.addEventListener('mouseout', outHandler);
    });
  });
}

// Set up event listeners
function setupEventListeners() {
  // Apply button handler
  document.getElementById("apply-btn").addEventListener("click", function() {
    dashboardState.updateEndDate();
    updateAllCharts();
    
    // Update binary data indicators with the selected date
    if (typeof BinaryDataDisplay !== 'undefined') {
      // Get current probability value for failure probability indicator
      let currentProbValue = 0;
      let isFailureDetected = false;
      
      if (dashboardState.finalModelOutputData) {
        // Find the data point for the selected date
        const selectedData = dashboardState.finalModelOutputData.find(d => 
          d.date.getFullYear() === dashboardState.endDate.getFullYear() && 
          d.date.getMonth() === dashboardState.endDate.getMonth() && 
          d.date.getDate() === dashboardState.endDate.getDate()
        );
        
        if (selectedData) {
          currentProbValue = selectedData.y_prob;
          // Check if this is a failure day (actual = 1)
          isFailureDetected = selectedData.actual === 1;
          
          // Update the failure indicator
          updateFailureIndicator(isFailureDetected);
        }
      }
      
      BinaryDataDisplay.updateIndicators(dashboardState.endDate, currentProbValue);
    }
  });
  
  // End date selection handlers - only update the dropdowns, not the charts
  document.getElementById("end-month-select").addEventListener("change", function() {
    populateDaysForMonth(dashboardState.finalModelOutputData, parseInt(this.value));
    // We no longer call updateEndDate() or updateAllCharts() here
  });
  
  document.getElementById("end-day-select").addEventListener("change", function() {
    // We no longer call updateEndDate() or updateAllCharts() here
  });

  // Handle window resize
  window.addEventListener("resize", updateAllCharts);
}

// Update the failure indicator based on data
function updateFailureIndicator(isFailureDetected) {
  const failureIndicator = document.getElementById('failure-indicator');
  if (!failureIndicator) return;
  
  if (isFailureDetected) {
    failureIndicator.textContent = 'Failure detected.';
    failureIndicator.classList.remove('status-normal');
    failureIndicator.classList.add('status-failure');
  } else {
    failureIndicator.textContent = 'No failure detected.';
    failureIndicator.classList.remove('status-failure');
    failureIndicator.classList.add('status-normal');
  }
}

// Load all data files
async function loadDataFiles() {
  showLoadingIndicator(true);

  try {
    // Load DV_pressure data
    const responseDVPressure = await fetch("/data/DV_pressure_data.csv");
    const dvPressureText = await responseDVPressure.text();
    dashboardState.datasetDVPressure = processData(dvPressureText);

    // Load Oil_temperature data
    const responseOilTemp = await fetch("/data/Oil_temperature_data.csv");
    const oilTempText = await responseOilTemp.text();
    dashboardState.datasetOilTemp = processData(oilTempText);

    // Load model output data
    const responseFinal = await fetch("/data/Model_output.csv");
    const finalText = await responseFinal.text();
    dashboardState.finalModelOutputData = processCSVData(finalText);
    dashboardState.finalModelOutputData = computeClassification(dashboardState.finalModelOutputData);

    // Initialize the date selection controls
    initializeEndDateSelection(dashboardState.finalModelOutputData);
    
    // Initialize the end date in the state
    dashboardState.updateEndDate();

    // Initialize charts
    initializeAllCharts();
    
    // Update all charts with the loaded data
    updateAllCharts();
    
    // Initialize failure indicator based on initial date
    if (dashboardState.finalModelOutputData) {
      const selectedData = dashboardState.finalModelOutputData.find(d => 
        d.date.getFullYear() === dashboardState.endDate.getFullYear() && 
        d.date.getMonth() === dashboardState.endDate.getMonth() && 
        d.date.getDate() === dashboardState.endDate.getDate()
      );
      
      if (selectedData) {
        const initialProbValue = selectedData.y_prob;
        const isFailureDetected = selectedData.actual === 1;
        
        // Update the failure indicator
        updateFailureIndicator(isFailureDetected);
        
        // Update binary indicators with initial date and probability value
        if (typeof BinaryDataDisplay !== 'undefined') {
          BinaryDataDisplay.updateIndicators(dashboardState.endDate, initialProbValue);
        }
      }
    }

    console.log("Data files loaded successfully");
  } catch (error) {
    console.error("Error loading data files:", error);
    alert("Failed to load data files. Please check the console for details.");
  } finally {
    showLoadingIndicator(false);
  }
}

// Helper for showing/hiding the loading indicator
function showLoadingIndicator(show) {
  const loadingIndicator = document.getElementById("loading-indicator");
  if (show) {
    loadingIndicator.classList.remove("hidden");
  } else {
    loadingIndicator.classList.add("hidden");
  }
}

// Process CSV data into a usable format
function processData(csvText) {
  // Use D3's CSV parser with auto type detection
  const results = d3.csvParse(csvText, d3.autoType);

  if (results.length === 0) {
    console.error("No data found in the CSV file");
    return null;
  }

  // Convert date strings to Date objects
  results.forEach((row) => {
    if (row.date && typeof row.date === "string") {
      row.date = new Date(row.date);
    }
    
    // Make sure month and day information is available for filtering
    if (row.date) {
      row.month = row.date.getMonth() + 1; // 1-based month
      row.day = row.date.getDate();
    }
  });

  // Sort data by date
  results.sort((a, b) => a.date - b.date);

  return results;
}

// Process model output CSV data
function processCSVData(csvText) {
  const data = d3.csvParse(csvText, function(d) {
    return {
      date: parseLocalDate(d.date),
      y_prob: +d.y_prob,
      actual: +d.actual,
      Prediction: +d.Prediction,
    };
  });

  data.sort((a, b) => a.date - b.date);
  return data;
}

// Parse a local date from string format "YYYY-MM-DD"
function parseLocalDate(dateStr) {
  const parts = dateStr.split("-");
  const year = +parts[0];
  const month = +parts[1] - 1; // JavaScript Date months are 0-indexed
  const day = +parts[2];
  return new Date(year, month, day);
}

// Add classification to the data
function computeClassification(data) {
  data.forEach((row) => {
    if (row.actual === 1) {
      row.classification = "Failure";
    } else if (row.Prediction === 1) {
      row.classification = "Pre-Failure";
    } else {
      row.classification = "Normal";
    }
  });
  return data;
}

// Initialize all charts
function initializeAllCharts() {
  // Initialize individual charts
  dashboardState.charts.dvPressure = DVPressureChart.initialize("chart-dv-pressure");
  dashboardState.charts.oilTemperature = OilTemperatureChart.initialize("chart-oil-temperature");
  dashboardState.charts.predictionSummary = PredictionSummaryChart.initialize("chart-prediction-summary");
}

// Update all charts
function updateAllCharts() {
  // Process data to ensure control parameters are for the selected day only
  const selectedDay = {
    year: dashboardState.endDate.getFullYear(),
    month: dashboardState.endDate.getMonth() + 1, // 1-based month
    day: dashboardState.endDate.getDate()
  };
  
  // Find data for the selected day
  let dvPressureData = null;
  let oilTempData = null;
  
  if (dashboardState.datasetDVPressure) {
    // Find the exact day's data for parameters
    const dayData = dashboardState.datasetDVPressure.find(d => 
      d.date.getFullYear() === selectedDay.year && 
      d.date.getMonth() + 1 === selectedDay.month && 
      d.date.getDate() === selectedDay.day
    );
    
    // Apply the selected day's parameters to all data points
    if (dayData) {
      // Create a shallow copy of the dataset
      dvPressureData = dashboardState.datasetDVPressure.map(d => ({
        ...d,
        // Use parameters from the selected day
        monthly_mean: dayData.cumulative_mean,
        monthly_std_dev: dayData.cumulative_std_dev,
        ucl_1: dayData.ucl_1,
        lcl_1: dayData.lcl_1,
        ucl_2: dayData.ucl_2,
        lcl_2: dayData.lcl_2, 
        ucl_3: dayData.ucl_3,
        lcl_3: dayData.lcl_3,
        // Add a flag for the selected date
        isSelectedDate: d.date.getFullYear() === selectedDay.year && 
                         d.date.getMonth() + 1 === selectedDay.month && 
                         d.date.getDate() === selectedDay.day
      }));
    } else {
      dvPressureData = dashboardState.datasetDVPressure;
    }
    
    // Update DV Pressure chart
    DVPressureChart.update(
      dashboardState.charts.dvPressure, 
      dvPressureData, 
      dashboardState.selectedMonth, 
      dashboardState.sigmaLevel,
      dashboardState.startDate,
      dashboardState.endDate
    );
  }

  if (dashboardState.datasetOilTemp) {
    // Find the exact day's data for parameters
    const dayData = dashboardState.datasetOilTemp.find(d => 
      d.date.getFullYear() === selectedDay.year && 
      d.date.getMonth() + 1 === selectedDay.month && 
      d.date.getDate() === selectedDay.day
    );
    
    // Apply the selected day's parameters to all data points
    if (dayData) {
      // Create a shallow copy of the dataset
      oilTempData = dashboardState.datasetOilTemp.map(d => ({
        ...d,
        // Use parameters from the selected day
        monthly_mean: dayData.cumulative_mean,
        monthly_std_dev: dayData.cumulative_std_dev,
        ucl_1: dayData.ucl_1,
        lcl_1: dayData.lcl_1,
        ucl_2: dayData.ucl_2,
        lcl_2: dayData.lcl_2, 
        ucl_3: dayData.ucl_3,
        lcl_3: dayData.lcl_3,
        // Add a flag for the selected date
        isSelectedDate: d.date.getFullYear() === selectedDay.year && 
                         d.date.getMonth() + 1 === selectedDay.month && 
                         d.date.getDate() === selectedDay.day
      }));
    } else {
      oilTempData = dashboardState.datasetOilTemp;
    }
    
    // Update Oil Temperature chart
    OilTemperatureChart.update(
      dashboardState.charts.oilTemperature, 
      oilTempData, 
      dashboardState.selectedMonth, 
      dashboardState.sigmaLevel,
      dashboardState.startDate,
      dashboardState.endDate
    );
  }

  if (dashboardState.finalModelOutputData) {
    // Add the isSelectedDate flag to the final model output data
    const markedData = dashboardState.finalModelOutputData.map(d => ({
      ...d,
      isSelectedDate: d.date.getFullYear() === selectedDay.year && 
                      d.date.getMonth() + 1 === selectedDay.month && 
                      d.date.getDate() === selectedDay.day
    }));
    
    PredictionSummaryChart.update(
      dashboardState.charts.predictionSummary, 
      markedData,
      dashboardState.startDate,
      dashboardState.endDate
    );
  }
  
  console.log(`Charts updated with parameters from selected date: ${selectedDay.year}-${selectedDay.month}-${selectedDay.day}`);
}

// Initialize date selection controls
function initializeEndDateSelection(parsedData) {
  populateEndDateDropdowns(parsedData);
}

// Populate the end date dropdowns
function populateEndDateDropdowns(data) {
  const filteredData = data.filter((d) => {
    const month = d.date.getMonth() + 1;
    // Start from April (4) and go through August (8), removing September
    return month >= 4 && month <= 8;
  });

  const monthSet = new Set();
  filteredData.forEach((d) => {
    monthSet.add(d.date.getMonth() + 1);
  });
  const availableMonths = Array.from(monthSet).sort((a, b) => a - b);

  const monthNames = {
    4: "April",
    5: "May",
    6: "June",
    7: "July",
    8: "August"
  };

  const monthSelect = document.getElementById("end-month-select");
  const daySelect = document.getElementById("end-day-select");

  monthSelect.innerHTML = "";
  availableMonths.forEach((m) => {
    const option = document.createElement("option");
    option.value = m;
    option.text = monthNames[m] || m;
    monthSelect.appendChild(option);
  });

  // Default to the first month (April)
  monthSelect.value = availableMonths[0];

  populateDaysForMonth(filteredData, parseInt(monthSelect.value));
}

// Populate the day dropdown based on the selected month
function populateDaysForMonth(filteredData, selectedMonth) {
  const daySelect = document.getElementById("end-day-select");
  const daysInMonth = filteredData.filter((d) => d.date.getMonth() + 1 === selectedMonth).map((d) => d.date.getDate());

  const uniqueDays = Array.from(new Set(daysInMonth)).sort((a, b) => a - b);

  daySelect.innerHTML = "";
  uniqueDays.forEach((day) => {
    const option = document.createElement("option");
    option.value = day;
    option.text = day;
    daySelect.appendChild(option);
  });

  // Choose the first available day
  daySelect.value = uniqueDays[0];
}

// Helper function to format duration
function formatDuration(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  const remainingHours = hours % 24;
  const remainingMinutes = minutes % 60;
  
  let result = "";
  if (days > 0) {
    result += `${days} day${days > 1 ? 's' : ''} `;
  }
  if (remainingHours > 0 || days > 0) {
    result += `${remainingHours} hour${remainingHours > 1 ? 's' : ''} `;
  }
  if (remainingMinutes > 0 || remainingHours > 0 || days > 0) {
    result += `${remainingMinutes} min${remainingMinutes > 1 ? 's' : ''}`;
  }
  
  return result.trim();
}