#!/usr/bin/env python3
"""
Tyrian Reborn - Space Shooter 9
Cross-platform game launcher for Mac and Windows

Double-click this file to start the game, or run: python3 run_game.py
"""

import os
import sys
import time
import subprocess
import webbrowser
import signal
import platform
from pathlib import Path

# Configuration
PORT = 8006
HOST = "127.0.0.1"
URL = f"http://{HOST}:{PORT}/"
DOCS_DIR = Path(__file__).parent / "docs"
PID_FILE = Path(__file__).parent / ".server.pid"
LOG_FILE = Path(__file__).parent / ".server.log"

# Global server process
server_process = None


def kill_existing_server():
    """Kill any existing server on the port"""
    try:
        if platform.system() == "Windows":
            # Windows: find process using netstat
            result = subprocess.run(
                ["netstat", "-ano"],
                capture_output=True,
                text=True,
                creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, 'CREATE_NO_WINDOW') else 0
            )
            for line in result.stdout.split('\n'):
                if f":{PORT}" in line and "LISTENING" in line:
                    parts = line.split()
                    if len(parts) > 0:
                        try:
                            pid = int(parts[-1])
                            subprocess.run(["taskkill", "/F", "/PID", str(pid)], 
                                         capture_output=True,
                                         creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, 'CREATE_NO_WINDOW') else 0)
                        except (ValueError, IndexError):
                            pass
        else:
            # Mac/Linux: use lsof
            result = subprocess.run(
                ["lsof", "-ti", f":{PORT}"],
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                pids = result.stdout.strip().split('\n')
                for pid in pids:
                    if pid:
                        try:
                            subprocess.run(["kill", "-9", pid], capture_output=True)
                        except:
                            pass
    except Exception as e:
        print(f"Note: Could not check for existing servers: {e}")


def start_server():
    """Start the HTTP server"""
    global server_process
    
    # Change to docs directory
    os.chdir(DOCS_DIR)
    
    # Start server
    try:
        if platform.system() == "Windows":
            # Windows: hide console window
            server_process = subprocess.Popen(
                [sys.executable, "-m", "http.server", str(PORT), "--bind", HOST],
                stdout=open(LOG_FILE, 'w'),
                stderr=subprocess.STDOUT,
                creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, 'CREATE_NO_WINDOW') else 0
            )
        else:
            # Mac/Linux
            server_process = subprocess.Popen(
                [sys.executable, "-m", "http.server", str(PORT), "--bind", HOST],
                stdout=open(LOG_FILE, 'w'),
                stderr=subprocess.STDOUT
            )
        
        # Save PID
        with open(PID_FILE, 'w') as f:
            f.write(str(server_process.pid))
        
        # Wait a moment for server to start
        time.sleep(2)
        
        # Check if server is still running
        if server_process.poll() is not None:
            print("❌ Server failed to start. Check .server.log for errors.")
            return False
        
        print(f"✅ Server started on {URL} (PID: {server_process.pid})")
        return True
        
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        return False


def open_browser():
    """Open the game in the default browser"""
    try:
        webbrowser.open(URL)
        print(f"🌐 Opening browser to {URL}")
    except Exception as e:
        print(f"⚠️  Could not open browser automatically: {e}")
        print(f"   Please open {URL} manually in your browser")


def cleanup():
    """Clean up server process"""
    global server_process
    
    if server_process:
        print("\n🛑 Stopping server...")
        try:
            if platform.system() == "Windows":
                subprocess.run(["taskkill", "/F", "/PID", str(server_process.pid)],
                             capture_output=True,
                             creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, 'CREATE_NO_WINDOW') else 0)
            else:
                server_process.terminate()
                time.sleep(0.5)
                if server_process.poll() is None:
                    server_process.kill()
        except:
            pass
        server_process = None
    
    # Clean up PID file
    if PID_FILE.exists():
        PID_FILE.unlink()
    
    print("✅ Server stopped. Goodbye!")


def signal_handler(signum, frame):
    """Handle interrupt signals"""
    cleanup()
    sys.exit(0)


def main():
    """Main function"""
    print("=" * 60)
    print("🎮 Tyrian Reborn - Space Shooter 9")
    print("=" * 60)
    print()
    
    # Check if docs directory exists
    if not DOCS_DIR.exists():
        print(f"❌ Error: {DOCS_DIR} directory not found!")
        print("   Please run this script from the game root directory.")
        input("\nPress Enter to exit...")
        sys.exit(1)
    
    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Kill any existing server
    print("🧹 Cleaning up any existing servers...")
    kill_existing_server()
    
    # Start server
    print("🚀 Starting game server...")
    if not start_server():
        input("\nPress Enter to exit...")
        sys.exit(1)
    
    # Open browser
    open_browser()
    
    print()
    print("🎮 Game is running!")
    print("   Press Ctrl+C to stop the server")
    print(f"   Server logs: {LOG_FILE}")
    print()
    
    # Keep running until interrupted
    try:
        while True:
            # Check if server is still running
            if server_process.poll() is not None:
                print("❌ Server process ended unexpectedly!")
                break
            time.sleep(1)
    except KeyboardInterrupt:
        pass
    finally:
        cleanup()


if __name__ == "__main__":
    # On Windows, if double-clicked, keep window open on error
    if platform.system() == "Windows" and len(sys.argv) == 1:
        try:
            main()
        except Exception as e:
            print(f"\n❌ Error: {e}")
            input("\nPress Enter to exit...")
    else:
        main()
