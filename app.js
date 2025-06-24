// Global variables
let selectedFile = null;
let attendanceData = [];
let registeredPeople = [];
let pythonProcess = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    updateDashboard();
});

// Initialize application
function initializeApp() {
    loadRegisteredPeople();
    loadAttendanceData();
}

// Setup all event listeners
function setupEventListeners() {
    const uploadArea = document.getElementById('uploadArea');
    const imageInput = document.getElementById('imageInput');
    const personName = document.getElementById('personName');

    // Upload area events
    uploadArea.addEventListener('click', () => imageInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // File input and name input events
    imageInput.addEventListener('change', handleFileInputChange);
    personName.addEventListener('input', checkFormValidity);
}

// Tab switching functionality
function switchTab(tabName) {
    // Hide all tab contents
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));

    // Remove active class from all nav tabs
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => tab.classList.remove('active'));

    // Show selected tab and mark nav tab as active
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');

    // Update dashboard data when switching to dashboard
    if (tabName === 'dashboard') {
        updateDashboard();
    }
}

// File upload handlers
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelect(files[0]);
    }
}

function handleFileInputChange(e) {
    if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
    }
}

function handleFileSelect(file) {
    if (!file.type.startsWith('image/')) {
        showAlert('Please select a valid image file (JPG, PNG, JPEG).', 'error');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showAlert('File size should be less than 5MB.', 'error');
        return;
    }

    selectedFile = file;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const imagePreview = document.getElementById('imagePreview');
        const previewContainer = document.getElementById('previewContainer');
        
        imagePreview.src = e.target.result;
        previewContainer.style.display = 'block';
    };
    reader.readAsDataURL(file);

    checkFormValidity();
}

function checkFormValidity() {
    const personName = document.getElementById('personName');
    const registerBtn = document.getElementById('registerBtn');
    const isValid = selectedFile && personName.value.trim();
    registerBtn.disabled = !isValid;
}

// Register new person with real backend integration
async function registerPerson() {
    const personName = document.getElementById('personName');
    const registerBtn = document.getElementById('registerBtn');
    
    if (!selectedFile || !personName.value.trim()) {
        showAlert('Please provide both image and name.', 'error');
        return;
    }

    const name = personName.value.trim();

    // Update UI to show processing
    registerBtn.disabled = true;
    registerBtn.textContent = '⏳ Processing...';

    try {
        // Create FormData to send file
        const formData = new FormData();
        formData.append('image', selectedFile);
        formData.append('name', name);

        // Send to backend
        const response = await fetch('/api/upload-person', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            showAlert(`✅ ${name} has been successfully registered!`, 'success');
            
            
            // Update dashboard
            await loadRegisteredPeople();
            updateDashboard();
        } else {
            throw new Error(result.error || 'Registration failed');
        }
        
    } catch (error) {
        console.error('Registration error:', error);
        showAlert(`❌ Failed to register person: ${error.message}`, 'error');
    } finally {
        registerBtn.disabled = false;
        registerBtn.textContent = '✨ Register Person';
    }
}

// Load registered people from backend
async function loadRegisteredPeople() {
    try {
        const response = await fetch('/api/registered-people');
        const data = await response.json();
        
        if (response.ok) {
            registeredPeople = data.registered_people || [];
        } else {
            console.error('Error loading registered people:', data.error);
            registeredPeople = [];
        }
    } catch (error) {
        console.error('Error loading registered people:', error);
        registeredPeople = [];
    }
}

// Load attendance data from backend
async function loadAttendanceData() {
    try {
        const response = await fetch('/api/attendance-records');
        const data = await response.json();
        
        if (response.ok) {
            attendanceData = data.attendance_records || [];
        } else {
            console.error('Error loading attendance data:', data.error);
            attendanceData = [];
        }
    } catch (error) {
        console.error('Error loading attendance data:', error);
        attendanceData = [];
    }
}

// Get today's date in YYYY-MM-DD format
function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

// Update dashboard with real data
function updateDashboard() {
    updateStats();
    loadAttendanceRecords();
}

function updateStats() {
    const totalRegistered = registeredPeople.length;
    const todayDate = getTodayDate();
    const todayAttendance = attendanceData.filter(record => record.date === todayDate).length;
    
    document.getElementById('totalRegistered').textContent = totalRegistered;
    document.getElementById('todayAttendance').textContent = todayAttendance;
}

function loadAttendanceRecords() {
    const tbody = document.getElementById('attendanceTableBody');
    tbody.innerHTML = '';

    // Sort by most recent first
    const sortedData = [...attendanceData].sort((a, b) => {
        const dateTimeA = new Date(`${a.date} ${a.time}`);
        const dateTimeB = new Date(`${b.date} ${b.time}`);
        return dateTimeB - dateTimeA;
    });

    // Show only last 10 records
    const recentRecords = sortedData.slice(0, 10);

    recentRecords.forEach(record => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${record.name}</td>
            <td>${record.time}</td>
            <td>${record.date}</td>
            <td><span style="color: #28a745; font-weight: bold;">✓ Present</span></td>
        `;
    });

    if (recentRecords.length === 0) {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td colspan="4" style="text-align: center; color: #6c757d;">
                No attendance records found
            </td>
        `;
    }
}

// Camera and attendance system functions with real backend integration
async function startAttendance() {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const cameraPlaceholder = document.getElementById('cameraPlaceholder');
    const webcamFeed = document.getElementById('webcamFeed');
    const attendanceStatus = document.getElementById('attendanceStatus');

    try {
        startBtn.disabled = true;
        startBtn.textContent = '⏳ Starting...';

        // Remove browser webcam usage
        // webcamStream = await navigator.mediaDevices.getUserMedia({ 
        //     video: { width: 640, height: 480 } 
        // });
        // webcamFeed.srcObject = webcamStream;

        // Show MJPEG stream from backend
        webcamFeed.src = '/api/video-feed';

        // Show video feed and hide placeholder
        cameraPlaceholder.style.display = 'none';
        webcamFeed.style.display = 'block';
        stopBtn.style.display = 'inline-block';
        attendanceStatus.style.display = 'block';

        // Start Python backend process
        const response = await fetch('/api/start-attendance', {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            pythonProcess = true;
            showAlert('🚀 Attendance system started successfully!', 'success');
            
            // Start monitoring attendance updates
            startAttendanceMonitoring();
        } else {
            throw new Error(result.error || 'Failed to start attendance system');
        }
        
    } catch (error) {
        console.error('Error starting attendance system:', error);
        showAlert(`❌ Failed to start attendance system: ${error.message}`, 'error');
        
        webcamFeed.style.display = 'none';
        cameraPlaceholder.style.display = 'flex';
        stopBtn.style.display = 'none';
        attendanceStatus.style.display = 'none';
    } finally {
        startBtn.disabled = false;
        startBtn.textContent = '🚀 Start Attendance System';
    }
}

function startAttendanceMonitoring() {
    // Monitor attendance updates every 2 seconds
    const monitoringInterval = setInterval(async () => {
        if (!pythonProcess) {
            clearInterval(monitoringInterval);
            return;
        }

        try {
            // Check for new attendance records
            await loadAttendanceData();
            updateDashboard();
            
        } catch (error) {
            console.error('Error monitoring attendance:', error);
        }
    }, 2000);
}

async function stopAttendance() {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const cameraPlaceholder = document.getElementById('cameraPlaceholder');
    const webcamFeed = document.getElementById('webcamFeed');
    const attendanceStatus = document.getElementById('attendanceStatus');

    try {
        // Stop Python process
        const response = await fetch('/api/stop-attendance', {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            pythonProcess = false;
            showAlert('⏹️ Attendance system stopped successfully.', 'success');
        } else {
            console.error('Error stopping attendance:', result.error);
        }
    } catch (error) {
        console.error('Error stopping attendance system:', error);
        pythonProcess = false;
    }

    // Remove MJPEG stream
    webcamFeed.src = '';
    webcamFeed.style.display = 'none';
    cameraPlaceholder.style.display = 'flex';
    stopBtn.style.display = 'none';
    attendanceStatus.style.display = 'none';
}

// Utility functions
function showAlert(message, type) {
    const alertDiv = document.getElementById('alertMessage');
    alertDiv.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    
    setTimeout(() => {
        alertDiv.innerHTML = '';
    }, 5000);
}

// Export attendance data to CSV
function exportAttendanceCSV() {
    let csvContent = 'Name,Time,Date\n';
    attendanceData.forEach(record => {
        csvContent += `${record.name},${record.time},${record.date}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendance_export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
}

// API functions for backend integration
class AttendanceAPI {
    static BASE_URL = '/api'; // Change this to your backend URL
    
    static async uploadImage(formData) {
        const response = await fetch(`${this.BASE_URL}/upload-person`, {
            method: 'POST',
            body: formData
        });
        return response.json();
    }
    
    static async getRegisteredPeople() {
        const response = await fetch(`${this.BASE_URL}/registered-people`);
        return response.json();
    }
    
    static async getAttendanceRecords() {
        const response = await fetch(`${this.BASE_URL}/attendance-records`);
        return response.json();
    }
    
    static async startAttendanceSystem() {
        const response = await fetch(`${this.BASE_URL}/start-attendance`, {
            method: 'POST'
        });
        return response.json();
    }
    
    static async stopAttendanceSystem() {
        const response = await fetch(`${this.BASE_URL}/stop-attendance`, {
            method: 'POST'
        });
        return response.json();
    }
}