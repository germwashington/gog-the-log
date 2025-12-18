# How to Run Tyrian Reborn - Space Shooter 9

## Quick Start

### On Mac or Linux:
```bash
make run
```
Or simply:
```bash
python3 run_game.py
```

### On Windows:
Double-click `run_game.bat` or run:
```bash
python run_game.py
```

## What It Does

The launcher will:
1. ✅ Start a local HTTP server on port 8006
2. 🌐 Automatically open the game in your default browser
3. 🛑 Keep running until you press Ctrl+C

## Requirements

- Python 3 (usually pre-installed on Mac/Linux)
- A web browser (Chrome, Firefox, Safari, Edge, etc.)

## Troubleshooting

### "Python not found"
- **Mac/Linux**: Usually pre-installed. Try `python3` instead of `python`
- **Windows**: Download from https://www.python.org/ (make sure to check "Add Python to PATH")

### Port already in use
The launcher will automatically kill any existing server on port 8006. If you still have issues:
```bash
make stop    # Mac/Linux
# Or manually kill the process using the port
```

### Browser doesn't open automatically
Just manually open: http://127.0.0.1:8006/

## Desktop Shortcut (Windows)

1. Right-click `run_game.bat`
2. Select "Create shortcut"
3. Drag the shortcut to your desktop
4. (Optional) Right-click shortcut → Properties → Change Icon to make it prettier

## Desktop Shortcut (Mac)

1. Right-click `run_game.py`
2. Select "Make Alias"
3. Drag the alias to your desktop
4. (Optional) Right-click alias → Get Info → Change icon

## Stopping the Server

- Press `Ctrl+C` in the terminal
- Or run `make stop` (Mac/Linux)
- The server will automatically stop when you close the terminal window
