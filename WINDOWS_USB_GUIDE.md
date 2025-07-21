# SecureWipe USB Creation - Windows Guide

## Quick Start (Automated)

### Prerequisites
- Windows 10/11 with Administrator privileges
- 8GB+ USB drive
- Internet connection

### Steps
1. **Right-click** `create-usb-windows.bat`
2. **Select** "Run as administrator"
3. **Follow prompts** to download Ubuntu ISO and select USB drive
4. **Wait for completion** (15-30 minutes)

---

## Manual Method (Step by Step)

### Step 1: Download Ubuntu ISO
1. Go to: https://releases.ubuntu.com/22.04/
2. Download: `ubuntu-22.04.3-desktop-amd64.iso` (4.7GB)
3. Save to Downloads folder

### Step 2: Download Rufus
1. Go to: https://rufus.ie/
2. Download latest Rufus (portable version)
3. Save to same folder as SecureWipe

### Step 3: Create Bootable USB
1. **Insert USB drive** (8GB+)
2. **Run Rufus** as Administrator
3. **Select USB device**
4. **Select Ubuntu ISO** file
5. **Partition scheme**: MBR
6. **Target system**: BIOS or UEFI
7. **Click START** and wait (10-15 minutes)

### Step 4: Add SecureWipe
1. **Open USB drive** in File Explorer
2. **Create folder**: `securewipe`
3. **Copy all SecureWipe files** to USB:\securewipe\
4. **Create** `start-securewipe.sh` with content:
```bash
#!/bin/bash
cd /media/ubuntu/*/securewipe
sudo ./install.sh
sudo ./run.sh
```

### Step 5: Create Desktop Shortcut
Create `SecureWipe.desktop` on USB root:
```ini
[Desktop Entry]
Version=1.0
Type=Application
Name=SecureWipe
Comment=Secure Disk Wiping Tool
Exec=sudo /media/ubuntu/*/securewipe/run.sh
Icon=/media/ubuntu/*/securewipe/icon.png
Terminal=true
Categories=System;Security;
```

---

## Alternative: Ventoy Method

### What is Ventoy?
Ventoy allows multiple ISOs on one USB drive.

### Steps
1. **Download Ventoy**: https://www.ventoy.net/
2. **Install Ventoy** to USB drive
3. **Copy Ubuntu ISO** to USB
4. **Copy SecureWipe folder** to USB
5. **Boot from USB** and select Ubuntu ISO

### Advantages
- **Multiple ISOs** on one USB
- **Easy updates** - just replace files
- **No re-flashing** required

---

## Usage Instructions

### Booting SecureWipe USB
1. **Insert USB** into target computer
2. **Restart** and press F12/F2/DEL (varies by manufacturer)
3. **Select USB** from boot menu
4. **Choose** "Try Ubuntu" (not Install)
5. **Wait** for desktop to load

### Starting SecureWipe
**Method 1 - Terminal:**
```bash
sudo /media/ubuntu/*/start-securewipe.sh
```

**Method 2 - Desktop:**
1. Double-click `SecureWipe.desktop` on desktop
2. Enter password when prompted

**Method 3 - Manual:**
```bash
cd /media/ubuntu/*/securewipe
sudo ./install.sh
sudo ./run.sh
```

---

## Troubleshooting

### USB Won't Boot
- **Check BIOS settings** - Enable USB boot
- **Try different USB port** - Use USB 2.0 if available
- **Recreate USB** - Some USBs are incompatible
- **Check ISO integrity** - Re-download if corrupted

### SecureWipe Won't Start
- **Run install script**: `sudo ./install.sh`
- **Check permissions**: Files should be executable
- **Missing dependencies**: Install Node.js manually
- **Display issues**: Run `xhost +local:root`

### Disk Detection Issues
- **Run as root**: Always use `sudo`
- **Check connections**: Ensure disks are connected
- **Try refresh**: Click refresh button in app
- **Check logs**: Look at console output

### Permission Errors
```bash
# Fix file permissions
sudo chmod +x /media/ubuntu/*/securewipe/run.sh
sudo chmod +x /media/ubuntu/*/securewipe/install.sh

# Fix display permissions
xhost +local:root
```

---

## Security Best Practices

### USB Security
- **Dedicated USB** - Use only for SecureWipe
- **Secure storage** - Keep USB locked when not in use
- **Regular updates** - Update SecureWipe regularly
- **Verify integrity** - Check files haven't been modified

### Operational Security
- **Test first** - Always test on non-critical systems
- **Verify targets** - Double-check device paths
- **Document operations** - Keep records for compliance
- **Offline operation** - Disconnect network if required

### Physical Security
- **Controlled access** - Limit who can use USB
- **Supervised use** - Monitor operations
- **Secure disposal** - Properly dispose of old USBs
- **Backup USBs** - Keep spare USBs ready

---

## Advanced Configuration

### Custom Branding
Before creating USB, edit:
- `renderer/index.html` - Change UI text
- `icon.png` - Replace with company logo
- `package.json` - Update version info

### Additional Tools
Add to `install.sh`:
```bash
# Forensic tools
apt install -y sleuthkit autopsy testdisk

# Hardware tools  
apt install -y smartmontools hdparm

# Network tools
apt install -y nmap netcat
```

### Persistent Configuration
For settings that survive reboots:
1. Create persistent USB with tools like Universal USB Installer
2. Install SecureWipe to persistent partition
3. Configure auto-start in persistent session

---

## Production Deployment

### Quality Assurance Checklist
- [ ] Test on various hardware configurations
- [ ] Verify all wipe methods function correctly
- [ ] Confirm safety features prevent system disk access
- [ ] Test update mechanism works
- [ ] Document any hardware compatibility issues

### Distribution Process
- [ ] Create master USB image
- [ ] Generate verification checksums
- [ ] Package with documentation
- [ ] Train end users
- [ ] Establish support procedures

### Maintenance Schedule
- [ ] Monthly security updates
- [ ] Quarterly functionality testing
- [ ] Annual hardware compatibility review
- [ ] Continuous monitoring of GitHub releases
- [ ] Regular backup of USB configurations