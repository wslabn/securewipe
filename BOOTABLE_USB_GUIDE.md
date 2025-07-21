# SecureWipe Bootable USB Guide

## Creating a Linux Live USB with SecureWipe

### Prerequisites
- Ubuntu 22.04 LTS ISO or similar
- USB drive (8GB+) for creating bootable media
- Target disks to wipe (separate from boot USB)

### Step 1: Create Base Live USB
1. Download Ubuntu 22.04 LTS Desktop ISO
2. Use Rufus/Balena Etcher to create bootable USB
3. Boot from USB and select "Try Ubuntu"

### Step 2: Install SecureWipe
```bash
# Download SecureWipe
git clone https://github.com/wslabn/securewipe.git
cd securewipe

# Run installation script
sudo chmod +x install.sh
sudo ./install.sh
```

### Step 3: Launch SecureWipe
```bash
# Run SecureWipe with root privileges
sudo ./run.sh
```

### Step 4: Wipe Disks Safely
1. **Verify target disks** - Ensure you're not wiping the USB boot drive
2. **Select wipe method** - DoD 5220.22-M recommended for security
3. **Choose filesystem** - Format after wipe for immediate use
4. **Monitor progress** - Real-time progress tracking
5. **Verify completion** - Check results before removing USB

### Security Features
- ✅ **System disk protection** - Cannot wipe boot device
- ✅ **Auto-unmount** - Safely unmounts before wiping
- ✅ **Multiple passes** - DoD (3-pass), Gutmann (35-pass)
- ✅ **Real progress** - Accurate progress based on disk size
- ✅ **Format after wipe** - Creates clean filesystem

### Supported Filesystems
- **ext4** - Linux native
- **NTFS** - Windows compatibility
- **FAT32** - Universal compatibility
- **exFAT** - Large file support

### Troubleshooting
- **Permission errors**: Ensure running with `sudo`
- **Display issues**: Use `xhost +local:root` before running
- **Missing tools**: Run `sudo ./install.sh` again
- **Disk not detected**: Check USB connections and try `sudo lsblk`

### Important Warnings
⚠️ **Data destruction is permanent and irreversible**  
⚠️ **Always verify target device before proceeding**  
⚠️ **Keep boot USB separate from target disks**  
⚠️ **Test on non-critical disks first**  

## For Custom Live USB Creation

### Persistent Installation
To include SecureWipe in a custom live USB:

1. **Extract ISO contents**
2. **Add SecureWipe to `/home/user/`**
3. **Modify startup scripts** to auto-launch
4. **Repack ISO** with custom tools

### Auto-start Configuration
Copy `autostart.desktop` to:
```
/home/user/.config/autostart/
```

This will automatically launch SecureWipe on desktop login.