# Tyrian Reborn - Space Shooter 9
# Makefile for running the game

.PHONY: run help stop clean

# Default target
help:
	@echo "Tyrian Reborn - Space Shooter 9"
	@echo ""
	@echo "Available targets:"
	@echo "  make run    - Start the game server and open in browser"
	@echo "  make stop   - Stop any running game server"
	@echo "  make clean  - Clean up server logs and PID files"
	@echo ""
	@echo "Or simply run: python3 run_game.py"

# Run the game
run:
	@python3 run_game.py

# Stop server (if running)
stop:
	@if [ -f .server.pid ]; then \
		kill `cat .server.pid` 2>/dev/null || true; \
		rm -f .server.pid; \
		echo "✅ Server stopped"; \
	else \
		echo "ℹ️  No server PID file found"; \
	fi

# Clean up
clean: stop
	@rm -f .server.log .server.pid
	@echo "✅ Cleaned up server files"
