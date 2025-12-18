@echo off
REM Tyrian Reborn - Space Shooter 9
REM Windows batch file launcher
REM Double-click this file to start the game

python run_game.py
if errorlevel 1 (
    echo.
    echo Python not found! Please install Python 3 from https://www.python.org/
    echo.
    pause
)
