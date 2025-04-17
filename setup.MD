# Detailed Setup Instructions

This document provides detailed instructions for setting up the Predictive Maintenance for Metro Trains application locally.

## Prerequisites

- Python 3.6 or higher
- A terminal/command prompt
- Git (for cloning the repository)

## Installation Steps

### 1. Clone the Repository

Clone the project repository:

```bash
git clone [repository-url]
cd [project-directory]
```

### 2. Set Up a Virtual Environment

It's recommended to use a virtual environment to manage dependencies:

#### On Windows:

```bash
# Create the virtual environment
python -m venv venv

# Activate the virtual environment
venv\Scripts\activate
```

#### On macOS/Linux:

```bash
# Create the virtual environment
python3 -m venv venv

# Activate the virtual environment
source venv/bin/activate
```

You'll know the virtual environment is activated when you see `(venv)` at the beginning of your command prompt.

### 3. Install Required Packages

With the virtual environment activated, install the required packages:

```bash
pip install -r requirements.txt
```

This will install Flask and all other dependencies listed in the requirements.txt file.

### 4. Run the Application

Start the Flask application:

```bash
python app/app.py
```

You should see output similar to:
```
Starting server at http://localhost:6890
To use the application:
1. Make sure data CSV files are in the static/data directory
2. Open http://localhost:6890 in your browser
3. Use the controls to filter and visualize the data
Press Ctrl+C to stop the server
```

### 5. Access the Application

Open your web browser and navigate to:
```
http://localhost:6890
```

### 6. Troubleshooting Port Issues

If port 6890 is already in use, you can modify the port in `app/app.py`:

1. Open `app/app.py` in a text editor
2. Find the line `port = 6890`
3. Change it to another available port
4. Save the file and restart the server

### 7. Deactivating the Virtual Environment

When you're done using the application, you can deactivate the virtual environment:

```bash
deactivate
```

## Project Structure Details

### Static Files

- `app/static/csv/`: Contains the CSV data files used by the application
- `app/static/js/`: Contains JavaScript files for data visualization
  - `script_dv_pressure.js`: Handles DV pressure chart
  - `script_oil_temp.js`: Handles oil temperature chart
  - `script_prediction_summary.js`: Handles prediction visualization
  - `script_binary_data.js`: Handles binary data indicators
  - `main.js`: Main application script
- `app/static/css/`: Contains styling for the application

### Flask Application

The Flask application (`app/app.py`) serves:
- The main HTML page (from templates directory)
- Static files (CSS, JavaScript)
- API endpoints for data retrieval

## Deployment to Vercel

This project is configured for deployment on Vercel using the `vercel.json` file in the project root. For deploying your own instance:

1. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Log in to Vercel:
   ```bash
   vercel login
   ```

3. Deploy from the project root:
   ```bash
   vercel
   ```

4. Follow the prompts to complete the deployment

## Development Notes

- The application does not require importing CSV files as they are included in the static directory
- The Flask application is configured to run in debug mode for local development
- For production deployment, disable debug mode in app.py before deploying