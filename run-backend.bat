@echo off
cd /d "%~dp0backend"
if exist venv\Scripts\activate.bat call venv\Scripts\activate.bat
python manage.py runserver
pause
