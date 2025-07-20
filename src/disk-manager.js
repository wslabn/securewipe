const { spawn, exec } = require('child_process');
const os = require('os');
const util = require('util');
const execAsync = util.promisify(exec);

class DiskManager {
    static async getAvailableDisks() {
        const platform = os.platform();
        
        if (platform === 'linux') {
            return await this.getLinuxDisks();
        } else if (platform === 'win32') {
            return await this.getWindowsDisks();
        } else {
            throw new Error(`Platform ${platform} not supported`);
        }
    }

    static async getLinuxDisks() {
        try {
            // Use lsblk to get disk information
            const { stdout } = await execAsync('lsblk -J -o NAME,SIZE,TYPE,MODEL,MOUNTPOINT');
            const data = JSON.parse(stdout);
            
            const disks = [];
            
            for (const device of data.blockdevices) {
                // Only include physical disks (not partitions)
                if (device.type === 'disk') {
                    disks.push({
                        device: `/dev/${device.name}`,
                        name: device.name,
                        size: this.parseSize(device.size),
                        model: device.model || 'Unknown',
                        type: device.type,
                        mounted: device.mountpoint !== null
                    });
                }
            }
            
            return { disks };
        } catch (error) {
            console.error('Error getting Linux disks:', error);
            // Return mock data for development
            return this.getMockDisks();
        }
    }

    static async getWindowsDisks() {
        try {
            // Use wmic to get disk information on Windows
            const { stdout } = await execAsync('wmic diskdrive get DeviceID,Size,Model /format:csv');
            const lines = stdout.split('\n').filter(line => line.trim() && !line.startsWith('Node'));
            
            const disks = [];
            
            for (const line of lines) {
                const parts = line.split(',');
                if (parts.length >= 4) {
                    const deviceId = parts[1]?.trim();
                    const model = parts[2]?.trim();
                    const size = parseInt(parts[3]?.trim());
                    
                    if (deviceId && size) {
                        disks.push({
                            device: deviceId,
                            name: deviceId.replace('\\\\.\\', ''),
                            size: size,
                            model: model || 'Unknown',
                            type: 'disk',
                            mounted: false // TODO: Check mount status on Windows
                        });
                    }
                }
            }
            
            return { disks };
        } catch (error) {
            console.error('Error getting Windows disks:', error);
            // Return mock data for development
            return this.getMockDisks();
        }
    }

    static getMockDisks() {
        // Mock data for development and testing
        return {
            disks: [
                {
                    device: '/dev/sdb',
                    name: 'sdb',
                    size: 1000000000000, // 1TB
                    model: 'Mock Disk 1TB',
                    type: 'disk',
                    mounted: false
                },
                {
                    device: '/dev/sdc',
                    name: 'sdc',
                    size: 500000000000, // 500GB
                    model: 'Mock Disk 500GB',
                    type: 'disk',
                    mounted: true
                }
            ]
        };
    }

    static async getDiskInfo(devicePath) {
        const platform = os.platform();
        
        try {
            if (platform === 'linux') {
                return await this.getLinuxDiskInfo(devicePath);
            } else if (platform === 'win32') {
                return await this.getWindowsDiskInfo(devicePath);
            } else {
                throw new Error(`Platform ${platform} not supported`);
            }
        } catch (error) {
            console.error('Error getting disk info:', error);
            // Return mock info for development
            return {
                device: devicePath,
                size: 1000000000000,
                model: 'Mock Disk',
                filesystem: 'Unknown',
                mounted: false
            };
        }
    }

    static async getLinuxDiskInfo(devicePath) {
        const deviceName = devicePath.replace('/dev/', '');
        const { stdout } = await execAsync(`lsblk -J -o NAME,SIZE,MODEL,FSTYPE,MOUNTPOINT ${devicePath}`);
        const data = JSON.parse(stdout);
        
        const device = data.blockdevices[0];
        
        return {
            device: devicePath,
            size: this.parseSize(device.size),
            model: device.model || 'Unknown',
            filesystem: device.fstype || 'None',
            mounted: device.mountpoint !== null
        };
    }

    static async getWindowsDiskInfo(devicePath) {
        // TODO: Implement Windows disk info retrieval
        return {
            device: devicePath,
            size: 1000000000000,
            model: 'Windows Disk',
            filesystem: 'NTFS',
            mounted: false
        };
    }

    static parseSize(sizeStr) {
        if (!sizeStr) return 0;
        
        const units = {
            'B': 1,
            'K': 1024,
            'M': 1024 * 1024,
            'G': 1024 * 1024 * 1024,
            'T': 1024 * 1024 * 1024 * 1024
        };
        
        const match = sizeStr.match(/^([\d.]+)([BKMGT]?)$/);
        if (!match) return 0;
        
        const value = parseFloat(match[1]);
        const unit = match[2] || 'B';
        
        return Math.floor(value * (units[unit] || 1));
    }
}

module.exports = DiskManager;