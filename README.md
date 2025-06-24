# Face Recognition Attendance System

A modern AI-powered attendance tracking system using face recognition, OpenCV, Flask, and a web dashboard.

## Features

- Register new people with their images via a web interface.
- Real-time face recognition and attendance marking using your webcam.
- Live camera feed streamed to the browser.
- Dashboard with attendance statistics and recent records.
- Export attendance data as CSV.

## Folder Structure

```
Attendance Project/
├── app.js
├── attendance.py
├── backend.py
├── index.html
├── requirements.txt
├── Attendance.csv
├── imageattendance/      # Folder for registered face images
└── README.md
```

## Requirements

- Python 3.8+
- pip

Install dependencies:

```bash
pip install -r requirements.txt
```

## How to Run

1. **Start the Face Recognition Server**

   Open a terminal and run:

   ```bash
   python attendance.py
   ```

   - This will open your webcam and start a Flask server on port 5001.

2. **Start the Backend Server**

   Open another terminal and run:

   ```bash
   python backend.py
   ```

   - This will start the main backend and web server on port 5000.

3. **Open the Web Interface**

   Go to [http://localhost:5000](http://localhost:5000) in your browser.

## Usage

- **Register Person:**  
  Go to the "Register Person" tab, upload a clear face image, and enter the person's name and click on Upload.
  Then Refresh the website.

- **Start Attendance:**  
  Go to the "Start Attendance" tab and click "Start Attendance System".  
  The live camera feed will appear, and attendance will be marked automatically for recognized faces.

- **Dashboard:**  
  View statistics and recent attendance records.

- **Export:**  
  Download attendance records as a CSV file.

## Notes

- **Start Order:**  
  1. Run `attendance.py` first to start the camera and face recognition server.  
  2. Then run `backend.py` to start the web backend and dashboard.
- **Web Interface:**  
  Open [http://localhost:5000](http://localhost:5000) in your browser.

- **Adding New Faces:**  
  Register new people using the web interface. The system will automatically reload images for recognition.

- **Live Feed:**  
  The camera feed is streamed from `attendance.py` to the browser via the backend.

## Troubleshooting

- **Camera Not Detected:**  
  Ensure no other application is using the webcam. Only one process can access the camera at a time.

- **Feed Not Showing:**  
  - Make sure `attendance.py` is running before `backend.py`.
  - Check for errors in the terminal windows.

- **Dependencies:**  
  If you face issues with packages, ensure all dependencies are installed:
  ```
  pip install -r requirements.txt
  ```

- **Numpy Version:**  
  If you get errors related to numpy, check your version:
  ```
  python -c "import numpy; print(numpy.__version__)"
  ```

**Made by Yuvraj Gupta**
