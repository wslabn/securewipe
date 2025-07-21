# SecureWipe Bootable USB Creation Guide

## Method 1: Full Custom ISO (Recommended)

### Prerequisites
- Linux system with root access
- 8GB+ USB drive
- Internet connection (for Ubuntu download)
- Required packages: `wget`, `mkisofs`, `syslinux-utils`

### Install Dependencies
```bash
sudo apt update
sudo apt install wget genisoimage syslinux-utils
```

### Create Bootable USB
```bash
# Make script executable
chmod +x create-bootable-usb.sh

# Run as root
sudo ./create-bootable-usb.sh
```

### What It Does
1. **Downloads Ubuntu 22.04 LTS** (if not present)
2. **Extracts ISO contents** to temporary directory
3. **Installs SecureWipe** into the live environment
4. **Configures auto-start** on desktop login
5. **Creates new ISO** with SecureWipe integrated
6. **Writes to USB** as bootable hybrid image

### Result
- **Bootable USB** with Ubuntu 22.04 LTS
- **SecureWipe pre-installed** and ready to use
- **Desktop shortcut** for easy access
- **All dependencies** included

---

## Method 2: Add to Existing Ubuntu USB (Quick)

### Prerequisites
- Existing Ubuntu Live USB
- Linux system with root access

### Steps
```bash
# Make script executable
chmod +x create-usb-simple.sh

# Run as root
sudo ./create-usb-simple.sh
```

### What It Does
1. **Mounts existing USB** drive
2. **Copies SecureWipe** to USB
3. **Creates desktop shortcut**
4. **Adds startup script**

### Usage
1. **Boot from USB** (Ubuntu Live)
2. **Open terminal**
3. **Run**: `sudo /media/ubuntu/*/start-securewipe.sh`

---

## Method 3: Manual Installation

### Create Ubuntu Live USB
1. Download Ubuntu 22.04 LTS Desktop ISO
2. Use Rufus/Balena Etcher to create bootable USB
3. Boot from USB and select "Try Ubuntu"

### Install SecureWipe
```bash
# Clone repository
git clone https://github.com/wslabn/securewipe.git
cd securewipe

# Install dependencies
sudo ./install.sh

# Run SecureWipe
sudo ./run.sh
```

---

## Verification & Testing

### Boot Test
1. **Insert USB** into target computer
2. **Boot from USB** (F12/F2 during startup)
3. **Select "Try Ubuntu"** or "SecureWipe Live"
4. **Wait for desktop** to load

### SecureWipe Test
1. **Double-click SecureWipe** desktop icon
2. **Verify disk detection** works
3. **Test with non-critical disk** first
4. **Confirm safety features** prevent system disk access

### Troubleshooting
- **No boot menu**: Check BIOS/UEFI boot order
- **SecureWipe won't start**: Run `sudo ./install.sh` first
- **Permission errors**: Ensure running with `sudo`
- **Display issues**: Use `xhost +local:root` before running

---

## Security Considerations

### USB Security
- **Use dedicated USB** for SecureWipe only
- **Verify USB integrity** before each use
- **Keep USB secure** when not in use
- **Update regularly** using built-in updater

### Operational Security
- **Verify target disks** before wiping
- **Disconnect network** if required
- **Document operations** for compliance
- **Secure disposal** of USB when retired

### Data Protection
- **Never use on production systems** without testing
- **Always verify device paths** before proceeding
- **Keep system disk separate** from target disks
- **Test recovery procedures** beforehand

---

## Advanced Configuration

### Custom Branding
Edit these files before creating USB:
- `renderer/index.html` - UI text
- `icon.png` - Application icon
- `autostart.desktop` - Desktop entry

### Additional Tools
Add to `install.sh`:
```bash
# Add forensic tools
apt install -y sleuthkit autopsy

# Add network tools
apt install -y nmap wireshark
```

### Persistent Storage
For persistent SecureWipe settings:
1. Create USB with persistent partition
2. Install SecureWipe to persistent area
3. Configure auto-start in persistent session

---

## Production Deployment

### Quality Assurance
- [ ] Test on multiple hardware configurations
- [ ] Verify all wipe methods work correctly
- [ ] Confirm safety features prevent accidents
- [ ] Test update mechanism
- [ ] Document known limitations

### Distribution
- [ ] Create standardized USB images
- [ ] Provide verification checksums
- [ ] Include usage documentation
- [ ] Train end users properly
- [ ] Establish support procedures

### Maintenance
- [ ] Regular security updates
- [ ] Monitor GitHub for new releases
- [ ] Test new versions before deployment
- [ ] Maintain backup USB drives
- [ ] Document configuration changes