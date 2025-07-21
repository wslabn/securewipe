#!/bin/bash
# SecureWipe Installation Script for Linux Live USB

echo "Installing SecureWipe dependencies..."

# Update package list
apt update

# Install Node.js and npm
apt install -y nodejs npm

# Install required system tools
apt install -y parted util-linux e2fsprogs dosfstools exfat-utils ntfs-3g

# Install dependencies
npm install

# Make scripts executable
chmod +x run.sh

echo "SecureWipe installation complete!"
echo "Run with: sudo ./run.sh"