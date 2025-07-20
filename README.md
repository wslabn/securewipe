# SecureWipe - Disk Wiping Tool

A secure disk wiping and formatting application built with Electron for bootable Linux USB environments.

## Features

- **Secure Disk Wiping**: Multiple wiping methods including DoD 5220.22-M, Gutmann, and random passes
- **Disk Formatting**: Support for ext4, NTFS, FAT32, and exFAT filesystems
- **Safety Checks**: Prevents wiping of boot devices and mounted disks
- **Cross-Platform Development**: Develop on Windows, deploy on Linux
- **Modern UI**: Clean, intuitive interface built with web technologies

## Development Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd securewipe
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

### Building

- Build for current platform: `npm run build`
- Build for Linux: `npm run build-linux`
- Build for Windows: `npm run build-win`

## Usage

### Development Mode

The application includes mock data and simulation modes for development on Windows. Real disk operations are only available on Linux.

### Production Mode

When running on Linux, the application will:
1. Detect available storage devices
2. Provide detailed disk information
3. Perform actual secure wiping and formatting operations

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

## Safety Features

- Boot device protection
- Mount status checking
- Multiple confirmation dialogs
- Operation validation
- Progress monitoring

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
│   └── safety-checks.js
└── assets/              # Resources
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

## Bootable Linux Integration

This application is designed to be integrated into a bootable Linux USB environment. See the documentation for creating custom live Linux distributions with this tool pre-installed.