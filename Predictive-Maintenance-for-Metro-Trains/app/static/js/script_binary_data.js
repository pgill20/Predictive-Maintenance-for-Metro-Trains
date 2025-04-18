// Binary Data Display Module
const BinaryDataDisplay = (function() {
  // Configuration
  const config = {
    containerId: 'binary-data-container',
    indicators: [
      { id: 'lps-indicator', name: 'LPS', field: 'LPS', color: '#4285F4', tooltip: 'Low Pressure Switch: Monitors system pressure levels' },
      { id: 'oil-level-indicator', name: 'Oil Level', field: 'Oil_level', color: '#EA4335', invertLogic: true, tooltip: 'Oil Level: Indicates lubricant level in the system. OFF means normal level, ON indicates high level requiring attention' },
      { id: 'caudal-impulses-indicator', name: 'Caudal Impulses', field: 'Caudal_impulses', color: '#FBBC05', tooltip: 'Caudal Impulses: Measures flow rate impulses in the hydraulic system' },
      { id: 'pressure-switch-indicator', name: 'Pressure Switch', field: 'Pressure_switch', color: '#34A853', tooltip: 'Pressure Switch: Indicates if system pressure is within operational range' },
      { id: 'failure-probability-indicator', name: 'Probability of Failure', field: 'failure_probability', color: '#9C27B0', tooltip: 'Probability of Failure: Random Forest model prediction for system failure likelihood' }
    ]
  };

  // Binary data storage
  let binaryData = null;

  // Initialize binary data display
  function initialize() {
    // Create container for binary data indicators if it doesn't exist
    if (!document.getElementById(config.containerId)) {
      const container = document.createElement('div');
      container.id = config.containerId;
      container.className = 'binary-data-container';
      
      // Create indicator boxes for each metric
      config.indicators.forEach(indicator => {
        const indicatorBox = document.createElement('div');
        indicatorBox.id = indicator.id;
        indicatorBox.className = 'binary-indicator';
        
        const indicatorTitle = document.createElement('div');
        indicatorTitle.className = 'indicator-title';
        
        // Create title container with help icon
        const titleContainer = document.createElement('div');
        titleContainer.className = 'title-container';
        
        const titleText = document.createElement('span');
        titleText.textContent = indicator.name;
        
        const helpIcon = document.createElement('span');
        helpIcon.className = 'help-icon';
        helpIcon.setAttribute('data-tooltip', indicator.tooltip);
        helpIcon.textContent = '?';
        helpIcon.title = indicator.tooltip;
        
        titleContainer.appendChild(titleText);
        titleContainer.appendChild(helpIcon);
        indicatorTitle.appendChild(titleContainer);
        
        const indicatorValue = document.createElement('div');
        indicatorValue.className = 'indicator-value';
        indicatorValue.textContent = 'N/A';
        
        indicatorBox.appendChild(indicatorTitle);
        indicatorBox.appendChild(indicatorValue);
        indicatorBox.style.borderColor = indicator.color;
        
        container.appendChild(indicatorBox);
      });
      
      // Insert the container before the charts-container
      const chartsContainer = document.querySelector('.charts-container');
      if (chartsContainer) {
        chartsContainer.parentNode.insertBefore(container, chartsContainer);
      }
    }
    
    // Load binary data
    loadBinaryData();
  }

  // Load binary data from CSV
  async function loadBinaryData() {
    try {
      const response = await fetch('/data/Binary_data.csv');
      const csvText = await response.text();
      binaryData = processData(csvText);
      console.log('Binary data loaded successfully');
    } catch (error) {
      console.error('Error loading binary data:', error);
    }
  }

  // Process CSV data
  function processData(csvText) {
    // Use D3's CSV parser
    const results = d3.csvParse(csvText, d3.autoType);
    
    if (results.length === 0) {
      console.error('No data found in the Binary_data.csv file');
      return null;
    }
    
    // Convert date strings to Date objects
    results.forEach((row) => {
      if (row.date && typeof row.date === 'string') {
        row.date = new Date(row.date);
      }
    });
    
    // Sort data by date
    results.sort((a, b) => a.date - b.date);
    
    return results;
  }

  // Update indicator values based on selected date
  function updateIndicators(selectedDate, probabilityValue = null) {
    if (!binaryData && config.indicators.length > 1) {
      console.warn('Binary data not loaded yet');
    }
    
    // Find the data for the selected date
    const selectedData = binaryData ? binaryData.find(d => {
      return d.date.getFullYear() === selectedDate.getFullYear() &&
             d.date.getMonth() === selectedDate.getMonth() &&
             d.date.getDate() === selectedDate.getDate();
    }) : null;
    
    // Update binary indicators (LPS, Oil Level, etc.)
    config.indicators.forEach(indicator => {
      if (indicator.field === 'failure_probability') {
        updateFailureProbabilityIndicator(indicator.id, probabilityValue);
      } else {
        updateBinaryIndicator(indicator, selectedData);
      }
    });
  }
  
  // Update a binary indicator (ON/OFF)
  function updateBinaryIndicator(indicator, selectedData) {
    const indicatorElement = document.getElementById(indicator.id);
    if (!indicatorElement) return;
    
    const valueElement = indicatorElement.querySelector('.indicator-value');
    if (!valueElement) return;
    
    if (selectedData && selectedData[indicator.field] !== undefined) {
      const value = selectedData[indicator.field];
      const isOn = value === 1 || value === true || value === "1" || value === "true";
      
      // Apply inverted logic for Oil Level (if specified)
      if (indicator.invertLogic) {
        // For Oil Level: OFF is good (green), ON is bad (red)
        if (isOn) {
          valueElement.textContent = 'ON';
          valueElement.classList.add('status-off');
          valueElement.classList.remove('status-on', 'status-medium', 'status-high');
        } else {
          valueElement.textContent = 'OFF';
          valueElement.classList.add('status-on');
          valueElement.classList.remove('status-off', 'status-medium', 'status-high');
        }
      } else {
        // Normal logic for other indicators
        if (isOn) {
          valueElement.textContent = 'ON';
          valueElement.classList.add('status-on');
          valueElement.classList.remove('status-off', 'status-medium', 'status-high');
        } else {
          valueElement.textContent = 'OFF';
          valueElement.classList.add('status-off');
          valueElement.classList.remove('status-on', 'status-medium', 'status-high');
        }
      }
    } else {
      valueElement.textContent = 'N/A';
      valueElement.classList.remove('status-on', 'status-off', 'status-medium', 'status-high');
    }
  }
  
  // Update the failure probability indicator
  function updateFailureProbabilityIndicator(indicatorId, probabilityValue) {
    const indicatorElement = document.getElementById(indicatorId);
    if (!indicatorElement) return;
    
    const valueElement = indicatorElement.querySelector('.indicator-value');
    if (!valueElement) return;
    
    // Remove all status classes first
    valueElement.classList.remove('status-on', 'status-off', 'status-medium', 'status-high');
    
    if (probabilityValue !== null && !isNaN(probabilityValue)) {
      // Format the probability value to 2 decimal places
      const formattedProb = probabilityValue.toFixed(2);
      
      // Determine status and level based on probability thresholds
      let level = '';
      
      if (probabilityValue < 0.5) {
        level = 'Low';
        valueElement.classList.add('status-on'); // Green
      } else if (probabilityValue >= 0.5 && probabilityValue <= 0.8) {
        level = 'Mid';
        valueElement.classList.add('status-medium'); // Yellow/Orange
      } else {
        level = 'High';
        valueElement.classList.add('status-high'); // Red
      }
      
      // Display probability value and level
      valueElement.textContent = formattedProb + ' - ' + level;
    } else {
      valueElement.textContent = 'N/A';
    }
  }

  // Public API
  return {
    initialize,
    updateIndicators
  };
})();