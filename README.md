# SecureWipe - Professional Disk Wiping Tool

A secure disk wiping and formatting application built with Electron for bootable Linux USB environments. Features automated ISO building, GitHub integration, and enterprise-grade security.

**Current Version**: v1.0.1 | **Status**: Production Ready

## 🚀 Quick Start

### Download Bootable ISO
1. Go to [Releases](https://github.com/wslabn/securewipe/releases)
2. Download `securewipe-live.iso` (~5GB)
3. Write to USB drive
4. Boot and start wiping!

### Create Custom ISO
```bash
# Windows (automated)
build-release.bat

# Linux (manual)
sudo ./create-bootable-usb.sh
```

## ✨ Features

### 🔒 Security Features
- **Military-Grade Wiping**: DoD 5220.22-M, Gutmann (35-pass), Random, Zero Fill
- **System Protection**: Prevents wiping boot/system disks
- **Auto-Unmount**: Safely unmounts before wiping
- **Multi-Disk Support**: Process up to 8 disks simultaneously
- **Real-Time Progress**: Accurate progress based on actual disk size

### 💾 Disk Operations
- **Secure Wiping**: Multiple pass methods for complete data destruction
- **Format After Wipe**: Automatic filesystem creation (ext4, NTFS, FAT32, exFAT)
- **Safety Validation**: Multiple confirmation dialogs and safety checks
- **Operation Logging**: Detailed console output for troubleshooting

### 🔄 Automation & Updates
- **Auto-Update**: GitHub integration with one-click updates
- **Automated ISO Building**: GitHub Actions creates bootable ISOs
- **Cross-Platform**: Develop on Windows, deploy on Linux
- **Professional UI**: Modern interface with splash screen

## 🛠️ Installation Methods

### Method 1: Bootable USB (Recommended)
```bash
# Download pre-built ISO from GitHub Releases
# Write to USB with dd, Rufus, or Balena Etcher
sudo dd if=securewipe-live.iso of=/dev/sdX bs=4M status=progress
```

### Method 2: Manual Installation
```bash
# Clone repository
git clone https://github.com/wslabn/securewipe.git
cd securewipe

# Install dependencies (Linux)
sudo ./install.sh

# Run SecureWipe
sudo ./run.sh
```

### Method 3: Development Setup
```bash
# Prerequisites: Node.js 16+, npm, git
git clone https://github.com/wslabn/securewipe.git
cd securewipe
npm install
npm run dev
```

## 💻 Usage

### Bootable USB Usage
1. **Boot from USB** - Select "Try Ubuntu"
2. **Auto-start** - SecureWipe launches automatically
3. **Select disks** - Choose target disks (up to 8)
4. **Choose method** - DoD, Gutmann, Random, or Zero Fill
5. **Start operation** - Monitor real-time progress
6. **Format (optional)** - Create filesystem after wiping

### Safety Features in Action
- ✅ **System disk detection** - Prevents accidental OS wiping
- ✅ **Auto-unmount** - Safely unmounts before operations
- ✅ **Multiple confirmations** - Prevents accidental operations
- ✅ **Progress monitoring** - Real-time status updates

## Wiping Methods

- **Single Pass Random**: Fast random data overwrite
- **DoD 5220.22-M**: 3-pass military standard
- **Gutmann Method**: 35-pass maximum security
- **Zero Fill**: Single pass with zeros

## Supported Filesystems

- **ext4**: Linux native filesystem
- **NTFS**: Windows filesystem
- **FAT32**: Universal compatibility
- **exFAT**: Large file support

## 🤖 Automated ISO Building

### Automatic Building
- **Every push to main** - ISO builds automatically
- **Tagged releases** - Creates GitHub releases
- **Development builds** - Available as artifacts

### Create Release (Windows)
```cmd
build-release.bat
# Enter version (e.g., v1.0.1)
# GitHub Actions builds ISO automatically
# Download from Releases in 15-20 minutes
```

### Manual USB Creation
```bash
# Linux - Full custom ISO
sudo ./create-bootable-usb.sh

# Linux - Add to existing Ubuntu USB
sudo ./create-usb-simple.sh

# Windows - Guided creation with Rufus
create-usb-windows.bat

# Docker - Local ISO building
docker build -t securewipe-builder .
docker run -v $(pwd)/output:/output securewipe-builder
```

## 📊 Technical Specifications

### System Requirements
- **Target**: Any x86_64 computer
- **RAM**: 2GB minimum, 4GB recommended
- **Storage**: 8GB+ USB drive for bootable image
- **Boot**: BIOS or UEFI compatible

### Supported Hardware
- **SATA/IDE drives** - Traditional hard drives and SSDs
- **USB drives** - External storage devices
- **NVMe drives** - Modern M.2 SSDs
- **Multiple interfaces** - Simultaneous processing

### Performance
- **Wipe speed**: 30-100 MB/s (hardware dependent)
- **Multi-disk**: Up to 8 disks simultaneously
- **Progress tracking**: Real-time byte-level accuracy
- **Memory usage**: <500MB RAM

## 🔗 Integration & Deployment

### Enterprise Deployment
- **Standardized ISOs** - Consistent deployment across organization
- **Auto-updates** - GitHub integration keeps tools current
- **Compliance logging** - Detailed operation records
- **Batch processing** - Multiple disk support

### Custom Branding
```bash
# Edit before building
renderer/index.html    # UI customization
icon.png              # Company logo
package.json          # Version info
```

## Project Structure

```
securewipe/
├── main.js              # Main Electron process
├── preload.js           # Secure IPC bridge
├── renderer/            # Frontend UI
│   ├── index.html
│   ├── styles.css
│   └── renderer.js
├── src/                 # Backend modules
│   ├── disk-manager.js
│   ├── wipe-engine.js
│   ├── format-manager.js
│   ├── safety-checks.js
│   └── updater.js
├── .github/workflows/   # Automated building
├── create-*.sh          # USB creation scripts
└── *.md                 # Documentation
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Security Notice

This tool permanently destroys data. Always verify the target device before proceeding with any operation. The developers are not responsible for data loss due to misuse.

## Documentation

- [Bootable USB Guide](BOOTABLE_USB_GUIDE.md) - Complete USB creation guide
- [Windows USB Guide](WINDOWS_USB_GUIDE.md) - Windows-specific instructions
- [USB Creation Guide](USB_CREATION_GUIDE.md) - Advanced USB creation methods