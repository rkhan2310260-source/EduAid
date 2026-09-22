@echo off
echo Starting EduAid Full Stack Application...
start cmd /k "cd /d C:\Users\hp\Desktop\EduAid\Backend && run-backend.bat"
start cmd /k "cd /d C:\Users\hp\Desktop\EduAid\Frontend && npm run dev"
echo Both servers are starting in separate windows.
echo Backend: http://localhost:8081
echo Frontend: http://localhost:5173
