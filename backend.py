from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import csv
import subprocess
import threading
import time
from datetime import datetime
from werkzeug.utils import secure_filename
import json

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'imageattendance'
ATTENDANCE_FILE = 'Attendance.csv'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

# Global variables
attendance_process = None
attendance_thread = None
is_running = False

# Ensure upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def read_attendance_csv():
    """Read attendance records from CSV file"""
    attendance_records = []
    try:
        if os.path.exists(ATTENDANCE_FILE):
            with open(ATTENDANCE_FILE, 'r', newline='', encoding='utf-8') as file:
                csv_reader = csv.reader(file)
                for row in csv_reader:
                    if len(row) >= 2:  # Ensure we have at least name and time
                        # Parse the time to get date
                        try:
                            time_obj = datetime.strptime(row[1], '%H:%M:%S')
                            date_str = datetime.now().strftime('%Y-%m-%d')  # Use current date
                            attendance_records.append({
                                'name': row[0],
                                'time': row[1],
                                'date': date_str
                            })
                        except ValueError:
                            # If time parsing fails, skip this record
                            continue
    except Exception as e:
        print(f"Error reading attendance CSV: {e}")
    
    return attendance_records

def get_registered_people():
    """Get list of registered people from imageattendance folder"""
    try:
        if not os.path.exists(UPLOAD_FOLDER):
            return []
        
        files = os.listdir(UPLOAD_FOLDER)
        people = []
        for file in files:
            if allowed_file(file):
                # Remove file extension to get person name
                name = os.path.splitext(file)[0]
                people.append(name)
        return people
    except Exception as e:
        print(f"Error getting registered people: {e}")
        return []

def run_attendance_system():
    """Run the attendance Python script"""
    global attendance_process, is_running
    try:
        # Start the attendance.py script
        attendance_process = subprocess.Popen(
            ['python', 'Attendance.py'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        is_running = True
        
        # Wait for process to complete or be terminated
        attendance_process.wait()
        is_running = False
        
    except Exception as e:
        print(f"Error running attendance system: {e}")
        is_running = False

@app.route('/')
def index():
    """Serve the main HTML file"""
    return send_from_directory('.', 'index.html')

@app.route('/app.js')
def serve_js():
    """Serve the JavaScript file"""
    return send_from_directory('.', 'app.js')

@app.route('/api/upload-person', methods=['POST'])
def upload_person():
    """Handle person registration with image upload"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        name = request.form.get('name')
        
        if not name:
            return jsonify({'error': 'No name provided'}), 400
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if file and allowed_file(file.filename):
            # Get file extension
            file_extension = file.filename.rsplit('.', 1)[1].lower()
            
            # Create new filename with person's name
            filename = f"{secure_filename(name)}.{file_extension}"
            
            # Save file to imageattendance folder
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            file.save(file_path)
            
            return jsonify({
                'message': f'Successfully registered {name}',
                'filename': filename,
                'path': file_path
            }), 200
        
        return jsonify({'error': 'Invalid file type'}), 400
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/registered-people', methods=['GET'])
def api_registered_people():
    """Get list of registered people"""
    try:
        people = get_registered_people()
        return jsonify({
            'registered_people': people,
            'count': len(people)
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/attendance-records', methods=['GET'])
def api_attendance_records():
    """Get attendance records from CSV"""
    try:
        records = read_attendance_csv()
        today = datetime.now().strftime('%Y-%m-%d')
        today_records = [r for r in records if r['date'] == today]
        
        return jsonify({
            'attendance_records': records,
            'today_count': len(today_records),
            'total_records': len(records)
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/start-attendance', methods=['POST'])
def start_attendance():
    """Start the attendance system"""
    global attendance_thread, is_running
    
    try:
        if is_running:
            return jsonify({'message': 'Attendance system is already running'}), 200
        
        # Start attendance system in a separate thread
        attendance_thread = threading.Thread(target=run_attendance_system)
        attendance_thread.daemon = True
        attendance_thread.start()
        
        # Give it a moment to start
        time.sleep(1)
        
        return jsonify({
            'message': 'Attendance system started successfully',
            'status': 'running'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stop-attendance', methods=['POST'])
def stop_attendance():
    """Stop the attendance system"""
    global attendance_process, is_running
    
    try:
        if attendance_process and attendance_process.poll() is None:
            attendance_process.terminate()
            attendance_process.wait(timeout=5)  # Wait up to 5 seconds for graceful shutdown
            
        is_running = False
        
        return jsonify({
            'message': 'Attendance system stopped successfully',
            'status': 'stopped'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/status', methods=['GET'])
def get_status():
    """Get current system status"""
    try:
        registered_count = len(get_registered_people())
        attendance_records = read_attendance_csv()
        today = datetime.now().strftime('%Y-%m-%d')
        today_count = len([r for r in attendance_records if r['date'] == today])
        
        return jsonify({
            'is_running': is_running,
            'registered_people': registered_count,
            'today_attendance': today_count,
            'total_records': len(attendance_records)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/export-attendance', methods=['GET'])
def export_attendance():
    """Export attendance records as CSV"""
    try:
        records = read_attendance_csv()
        
        # Create CSV content
        csv_content = "Name,Time,Date\n"
        for record in records:
            csv_content += f"{record['name']},{record['time']},{record['date']}\n"
        
        return csv_content, 200, {
            'Content-Type': 'text/csv',
            'Content-Disposition': f'attachment; filename=attendance_export_{datetime.now().strftime("%Y%m%d")}.csv'
        }
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    print("Starting Face Recognition Attendance System Backend...")
    print(f"Upload folder: {UPLOAD_FOLDER}")
    print(f"Attendance file: {ATTENDANCE_FILE}")
    print("Backend server starting on http://localhost:5000")
    
    # Create sample attendance file if it doesn't exist
    if not os.path.exists(ATTENDANCE_FILE):
        with open(ATTENDANCE_FILE, 'w', newline='') as file:
            writer = csv.writer(file)
            # File will be empty initially
            pass
    
    app.run(debug=True, host='0.0.0.0', port=5000)