#!/bin/bash

# Fix X11 authorization for root
xhost +local:root 2>/dev/null || true

# Fix permissions
chmod -R 755 node_modules/electron/dist

# Set environment variables
export DISPLAY=${DISPLAY:-:0}
export ELECTRON_ENABLE_LOGGING=1

# Run with appropriate flags
npm start