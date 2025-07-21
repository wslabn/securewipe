#!/bin/bash
# SecureWipe Bootable USB Creator

set -e

# Configuration
UBUNTU_ISO_URL="https://releases.ubuntu.com/22.04/ubuntu-22.04.5-desktop-amd64.iso"
UBUNTU_ISO="ubuntu-22.04.5-desktop-amd64.iso"
WORK_DIR="/tmp/securewipe-usb"
MOUNT_DIR="$WORK_DIR/mount"
EXTRACT_DIR="$WORK_DIR/extract"
SECUREWIPE_DIR="$(pwd)"

echo "🔧 SecureWipe Bootable USB Creator"
echo "=================================="

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run as root (use sudo)"
   exit 1
fi

# Get target USB device
echo "📋 Available USB devices:"
lsblk -o NAME,SIZE,TYPE,MOUNTPOINT | grep -E "(disk|part)" | grep -v "loop"
echo ""
read -p "🔌 Enter USB device (e.g., /dev/sdb): " USB_DEVICE

if [[ ! -b "$USB_DEVICE" ]]; then
    echo "❌ Device $USB_DEVICE not found"
    exit 1
fi

# Confirm device
echo "⚠️  WARNING: This will COMPLETELY ERASE $USB_DEVICE"
echo "📊 Device info:"
lsblk -o NAME,SIZE,MODEL,TYPE "$USB_DEVICE"
echo ""
read -p "❓ Continue? (yes/no): " CONFIRM

if [[ "$CONFIRM" != "yes" ]]; then
    echo "❌ Aborted"
    exit 1
fi

# Create work directory
echo "📁 Creating work directory..."
rm -rf "$WORK_DIR"
mkdir -p "$MOUNT_DIR" "$EXTRACT_DIR"

# Download Ubuntu ISO if not exists
if [[ ! -f "$UBUNTU_ISO" ]]; then
    echo "⬇️  Downloading Ubuntu 22.04 LTS..."
    wget -O "$UBUNTU_ISO" "$UBUNTU_ISO_URL"
else
    echo "✅ Using existing Ubuntu ISO"
fi

# Mount ISO
echo "💿 Mounting Ubuntu ISO..."
mount -o loop "$UBUNTU_ISO" "$MOUNT_DIR"

# Extract ISO contents
echo "📦 Extracting ISO contents..."
cp -rT "$MOUNT_DIR" "$EXTRACT_DIR"
umount "$MOUNT_DIR"

# Make extracted files writable
chmod -R +w "$EXTRACT_DIR"

# Install SecureWipe
echo "🛠️  Installing SecureWipe..."
SECUREWIPE_TARGET="$EXTRACT_DIR/home/securewipe"
mkdir -p "$SECUREWIPE_TARGET"
cp -r "$SECUREWIPE_DIR"/* "$SECUREWIPE_TARGET/"

# Create autostart directory
mkdir -p "$EXTRACT_DIR/etc/skel/.config/autostart"
cp "$SECUREWIPE_DIR/autostart.desktop" "$EXTRACT_DIR/etc/skel/.config/autostart/"

# Update autostart desktop file with correct path
sed -i 's|/home/user/securewipe|/home/securewipe|g' "$EXTRACT_DIR/etc/skel/.config/autostart/autostart.desktop"

# Create startup script
cat > "$EXTRACT_DIR/usr/local/bin/start-securewipe" << 'EOF'
#!/bin/bash
cd /home/securewipe
export DISPLAY=:0
sudo -E ./run.sh
EOF
chmod +x "$EXTRACT_DIR/usr/local/bin/start-securewipe"

# Add SecureWipe to desktop
cat > "$EXTRACT_DIR/etc/skel/Desktop/SecureWipe.desktop" << 'EOF'
[Desktop Entry]
Version=1.0
Type=Application
Name=SecureWipe
Comment=Secure Disk Wiping Tool
Exec=/usr/local/bin/start-securewipe
Icon=/home/securewipe/icon.png
Terminal=true
Categories=System;Security;
EOF
chmod +x "$EXTRACT_DIR/etc/skel/Desktop/SecureWipe.desktop"

# Create custom preseed for auto-install (optional)
cat > "$EXTRACT_DIR/preseed/securewipe.seed" << 'EOF'
# SecureWipe Live USB Configuration
d-i debian-installer/locale string en_US
d-i keyboard-configuration/xkb-keymap select us
d-i netcfg/choose_interface select auto
d-i mirror/country string manual
d-i time/zone string UTC
d-i user-setup/allow-password-weak boolean true
d-i user-setup/encrypt-home boolean false
EOF

# Update boot menu
cat > "$EXTRACT_DIR/isolinux/txt.cfg" << 'EOF'
default live
label live
  menu label ^Try SecureWipe Live
  kernel /casper/vmlinuz
  append initrd=/casper/initrd boot=casper quiet splash ---
label install
  menu label ^Install Ubuntu
  kernel /casper/vmlinuz
  append initrd=/casper/initrd boot=casper only-ubiquity quiet splash ---
EOF

# Create new ISO
echo "💿 Creating SecureWipe bootable ISO..."
cd "$EXTRACT_DIR"
mkisofs -D -r -V "SecureWipe Live" -cache-inodes -J -l \
    -b isolinux/isolinux.bin -c isolinux/boot.cat \
    -no-emul-boot -boot-load-size 4 -boot-info-table \
    -o "$WORK_DIR/securewipe-live.iso" .

# Make ISO hybrid (bootable from USB)
echo "🔧 Making ISO hybrid..."
isohybrid "$WORK_DIR/securewipe-live.iso"

# Write to USB
echo "💾 Writing to USB device $USB_DEVICE..."
umount "$USB_DEVICE"* 2>/dev/null || true
dd if="$WORK_DIR/securewipe-live.iso" of="$USB_DEVICE" bs=4M status=progress oflag=sync

# Cleanup
echo "🧹 Cleaning up..."
rm -rf "$WORK_DIR"

echo ""
echo "✅ SecureWipe Bootable USB Created Successfully!"
echo "🚀 Boot from $USB_DEVICE to use SecureWipe"
echo "📋 Features:"
echo "   • Ubuntu 22.04 LTS base"
echo "   • SecureWipe pre-installed"
echo "   • Auto-start on desktop"
echo "   • All dependencies included"
echo ""
echo "⚠️  Remember: This USB will boot into a live environment"
echo "    All SecureWipe operations will be performed on target disks"