import cv2
import numpy as np
import face_recognition
import os
from datetime import datetime
from flask import Flask, Response, jsonify, request

app = Flask(__name__)

path = "imageattendance"
images = []
classNames = []
encodeListKnown = []

def load_images_and_encodings():
    global images, classNames, encodeListKnown
    images = []
    classNames = []
    myList = os.listdir(path)
    print("Loading images:", myList)
    for cls in myList:
        curImg = cv2.imread(f'{path}/{cls}')
        if curImg is not None:
            images.append(curImg)
            classNames.append(os.path.splitext(cls)[0])
    encodeListKnown = findEncodings(images)
    print('Encoding Complete. Known:', classNames)

def findEncodings(images):
    encodeList = []
    for img in images:
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        encodings = face_recognition.face_encodings(img)
        if encodings:
            encodeList.append(encodings[0])
    return encodeList

def markAttendance(name):
    with open('Attendance.csv', 'r+') as f:
        myDataList = f.readlines()
        nameList = []
        for line in myDataList:
            entry = line.split(',')
            nameList.append(entry[0])
        if name not in nameList:
            now = datetime.now()
            dtString = now.strftime('%H:%M:%S')
            f.writelines(f'\n{name},{dtString}')

# Initial load
load_images_and_encodings()

cap = cv2.VideoCapture(0)  # Open the default camera

def gen_frames():
    while True:
        success, img = cap.read()
        if not success:
            break
        imgS = cv2.resize(img, (0, 0), None, 0.25, 0.25)
        imgS = cv2.cvtColor(imgS, cv2.COLOR_BGR2RGB)

        facesCurFrame = face_recognition.face_locations(imgS)
        encodesCurFrame = face_recognition.face_encodings(imgS, facesCurFrame)

        for encodeFace, faceLoc in zip(encodesCurFrame, facesCurFrame):
            matches = face_recognition.compare_faces(encodeListKnown, encodeFace)
            faceDis = face_recognition.face_distance(encodeListKnown, encodeFace)
            matchIndex = np.argmin(faceDis)
            if matches and matches[matchIndex]:
                name = classNames[matchIndex].upper()
                y1, x2, y2, x1 = faceLoc
                y1, x2, y2, x1 = y1 * 4, x2 * 4, y2 * 4, x1 * 4
                cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.rectangle(img, (x1, y2 - 35), (x2, y2), (0, 255, 0), cv2.FILLED)
                cv2.putText(img, name, (x1 + 6, y2 -6), cv2.FONT_HERSHEY_COMPLEX, 1, (255, 255, 255), 2)
                markAttendance(name)

        # --- MJPEG streaming ---
        ret, buffer = cv2.imencode('.jpg', img)
        frame = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.route('/video_feed')
def video_feed():
    return Response(gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/reload', methods=['POST'])
def reload_images():
    load_images_and_encodings()
    return jsonify({'status': 'reloaded', 'known': classNames}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=False)