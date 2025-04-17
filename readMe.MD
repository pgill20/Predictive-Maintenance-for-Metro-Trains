# Predictive Maintenance for Metro Trains

## CSE6242 - Data Visualization
## Georgia Tech

**Team Members**

1. Anish Manikonda
2. Krisanne Josephene Saviona Fernandes 
3. Kritika Mehta
4. Mayowa Omobo
5. Paramvir Singh Gill
6. Srikanth Krishnan Nampoothiri

## Overview

An interactive web application for visualizing time series data from metro train sensors, designed to display DV Pressure, Oil Pemperature values over time and provide predictive maintenance analytics. The dashboard helps maintenance teams take proactive actions by predicting potential failures before they occur.

## Features

- Interactive line charts for sensor data visualization
- Control charts with statistical limits for anomaly detection
- Random Forest predictive probability distribution visualization
- Date filtering via dropdown menus
- Responsive layout with controls and visualization areas
- Interactive tooltips showing precise values on hover
- Failure indicator system

## Live Demo

Access the live application here:
[https://predictive-maintenance-for-m-git-ff9ee3-paramvir-gills-projects.vercel.app/](https://predictive-maintenance-for-m-git-ff9ee3-paramvir-gills-projects.vercel.app/)

## Requirements

- Python 3.6 or higher
- Flask and dependencies (see requirements.txt)

## Project Structure

```
main directory 
├── app 
    ├── static 
    │   ├── csv      # Static CSV data files
    │   ├── js       # JavaScript files for visualization
    │   └── css      # CSS styling files
    ├── templates    # HTML templates
    ├── app.py       # Flask application entry point
├── .gitignore 
├── LICENSE 
├── README.md 
├── requirements.txt 
└── vercel.json      # Configuration for Vercel deployment
```

## Setup Instructions

For local development setup, please refer to the [setup.md](setup.md) file.

## Usage

1. Navigate to the application in your web browser
2. Use the "Month" and "Day" dropdowns to select a date range
3. Click "Apply" to update the charts with the selected date range
4. Hover over the charts to see detailed information about each data point
5. Check the failure indicator for system status

## Visualizations Explained

### DV Pressure Control Chart
Displays the pressure differential values over time with control limits. Spikes indicate potential pressure anomalies that may lead to system failures.

### Oil Temperature Control Chart
Shows oil temperature measurements over time with statistical control limits. Temperature variations outside control limits may indicate system issues.

### Random Forest Predictive Probability Distribution
Displays the machine learning model's prediction of failure probability. Green represents normal operation, yellow indicates pre-failure conditions, and red shows actual failures.

## Deployment

This application is deployed on Vercel. The configuration is managed via the `vercel.json` file in the project root.

## License

This project is open source and available under the terms specified in the LICENSE file.
