#!/bin/bash
# Simple SecureWipe USB Creator (for existing Ubuntu USB)

echo "🔧 SecureWipe USB Installer"
echo "=========================="

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "❌ Run with: sudo ./create-usb-simple.sh"
   exit 1
fi

# Find USB devices
echo "📋 Available USB devices:"
lsblk -o NAME,SIZE,LABEL,MOUNTPOINT | grep -E "sd[b-z]"

read -p "🔌 Enter USB device (e.g., sdb): " USB_DEV
USB_DEVICE="/dev/$USB_DEV"

if [[ ! -b "$USB_DEVICE" ]]; then
    echo "❌ Device $USB_DEVICE not found"
    exit 1
fi

# Mount USB
USB_MOUNT="/mnt/usb-securewipe"
mkdir -p "$USB_MOUNT"

# Try to mount the first partition
if mount "${USB_DEVICE}1" "$USB_MOUNT" 2>/dev/null; then
    echo "✅ Mounted ${USB_DEVICE}1"
elif mount "$USB_DEVICE" "$USB_MOUNT" 2>/dev/null; then
    echo "✅ Mounted $USB_DEVICE"
else
    echo "❌ Could not mount USB device"
    exit 1
fi

# Install SecureWipe
echo "📦 Installing SecureWipe to USB..."
SECUREWIPE_PATH="$USB_MOUNT/securewipe"
mkdir -p "$SECUREWIPE_PATH"
cp -r ./* "$SECUREWIPE_PATH/"

# Make executable
chmod +x "$SECUREWIPE_PATH/run.sh"
chmod +x "$SECUREWIPE_PATH/install.sh"

# Create desktop shortcut
cat > "$USB_MOUNT/SecureWipe.desktop" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=SecureWipe
Comment=Secure Disk Wiping Tool
Exec=sudo $SECUREWIPE_PATH/run.sh
Icon=$SECUREWIPE_PATH/icon.png
Terminal=true
Categories=System;Security;
EOF
chmod +x "$USB_MOUNT/SecureWipe.desktop"

# Create quick start script
cat > "$USB_MOUNT/start-securewipe.sh" << EOF
#!/bin/bash
cd $SECUREWIPE_PATH
sudo ./install.sh
sudo ./run.sh
EOF
chmod +x "$USB_MOUNT/start-securewipe.sh"

# Unmount
umount "$USB_MOUNT"
rmdir "$USB_MOUNT"

echo ""
echo "✅ SecureWipe installed to USB!"
echo "🚀 To use:"
echo "   1. Boot from USB (Ubuntu Live)"
echo "   2. Open terminal"
echo "   3. Run: sudo /media/ubuntu/*/start-securewipe.sh"
echo ""
echo "📁 Files installed to: /securewipe/"