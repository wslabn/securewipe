#!/bin/bash

# This script runs SecureWipe in text-only mode for headless servers

# Fix permissions
chmod -R 755 node_modules/electron/dist

# Set environment variables for headless operation
export DISPLAY=""
export ELECTRON_ENABLE_LOGGING=1
export ELECTRON_ENABLE_STACK_DUMPING=1

# Run with appropriate flags
node cli.js