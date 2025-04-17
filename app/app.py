from flask import Flask, send_from_directory, request, jsonify, render_template
import os

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/data/<path:filename>')
def serve_data(filename):
    return send_from_directory('static/data', filename)

@app.route('/data_info')
def get_data_info():
    """Endpoint to get information about data files"""
    dv_pressure_exists = os.path.exists('static/data/DV_pressure_data.csv')
    oil_temp_exists = os.path.exists('static/data/Oil_temperature_data.csv')
    
    response = {
        'dv_pressure': {
            'exists': dv_pressure_exists,
            'size': os.stat('static/data/DV_pressure_data.csv').st_size if dv_pressure_exists else 0,
            'modified': os.stat('static/data/DV_pressure_data.csv').st_mtime if dv_pressure_exists else 0
        },
        'oil_temperature': {
            'exists': oil_temp_exists,
            'size': os.stat('static/data/Oil_temperature_data.csv').st_size if oil_temp_exists else 0,
            'modified': os.stat('static/data/Oil_temperature_data.csv').st_mtime if oil_temp_exists else 0
        }
    }
    
    return jsonify(response)

if __name__ == '__main__':
    port = 6890
    print(f"Starting server at http://localhost:{port}")
    print("To use the application:")
    print("1. Make sure data CSV files are in the static/data directory")
    print(f"2. Open http://localhost:{port} in your browser")
    print("3. Use the controls to filter and visualize the data")
    print("Press Ctrl+C to stop the server")
    app.run(debug=True, host='0.0.0.0', port=port)