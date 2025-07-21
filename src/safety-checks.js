const os = require('os');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class SafetyChecks {
    static async validateWipeOperation(options) {
        const { device } = options;
        
        // Basic validation
        if (!device) {
            return { safe: false, reason: 'No device specified' };
        }
        
        // Check if device exists
        const deviceExists = await this.checkDeviceExists(device);
        if (!deviceExists) {
            return { safe: false, reason: `Device ${device} does not exist` };
        }
        
        // Check if device is mounted
        const isMounted = await this.checkDeviceMounted(device);
        if (isMounted) {
            return { safe: false, reason: `Device ${device} is currently mounted. Please unmount before wiping.` };
        }
        
        // Check if device is the boot device
        const isBootDevice = await this.checkBootDevice(device);
        if (isBootDevice) {
            return { safe: false, reason: `Cannot wipe boot device ${device}` };
        }
        
        // Check if device is a system disk
        const isSystemDisk = await this.checkSystemDisk(device);
        if (isSystemDisk) {
            return { safe: false, reason: `Device ${device} appears to be a system disk` };
        }
        
        return { safe: true };
    }

    static async validateFormatOperation(options) {
        const { device, filesystem } = options;
        
        // Basic validation
        if (!device) {
            return { safe: false, reason: 'No device specified' };
        }
        
        if (!filesystem) {
            return { safe: false, reason: 'No filesystem specified' };
        }
        
        // Check supported filesystems
        const supportedFilesystems = ['ext4', 'ntfs', 'fat32', 'exfat'];
        if (!supportedFilesystems.includes(filesystem)) {
            return { safe: false, reason: `Unsupported filesystem: ${filesystem}` };
        }
        
        // Check if device exists
        const deviceExists = await this.checkDeviceExists(device);
        if (!deviceExists) {
            return { safe: false, reason: `Device ${device} does not exist` };
        }
        
        // Check if device is mounted
        const isMounted = await this.checkDeviceMounted(device);
        if (isMounted) {
            return { safe: false, reason: `Device ${device} is currently mounted. Please unmount before formatting.` };
        }
        
        // Check if device is the boot device
        const isBootDevice = await this.checkBootDevice(device);
        if (isBootDevice) {
            return { safe: false, reason: `Cannot format boot device ${device}` };
        }
        
        return { safe: true };
    }

    static async checkDeviceExists(device) {
        const platform = os.platform();
        
        try {
            if (platform === 'linux') {
                // Check if device file exists
                const { stdout } = await execAsync(`test -b ${device} && echo "exists"`);
                return stdout.trim() === 'exists';
            } else if (platform === 'win32') {
                // For Windows, assume device exists for now
                // TODO: Implement proper Windows device checking
                return true;
            }
        } catch (error) {
            return false;
        }
        
        return false;
    }

    static async checkDeviceMounted(device) {
        const platform = os.platform();
        
        try {
            if (platform === 'linux') {
                // Check if any partition of the device is mounted
                const { stdout } = await execAsync(`mount | grep "^${device}"`);
                return stdout.trim().length > 0;
            } else if (platform === 'win32') {
                // For Windows development, assume not mounted
                return false;
            }
        } catch (error) {
            // If grep finds nothing, it returns non-zero exit code
            return false;
        }
        
        return false;
    }

    static async checkBootDevice(device) {
        const platform = os.platform();
        
        try {
            if (platform === 'linux') {
                // Check if device contains the root filesystem
                const { stdout } = await execAsync(`df / | tail -1 | awk '{print $1}'`);
                const rootDevice = stdout.trim();
                
                // Extract base device name (remove partition number)
                const baseRootDevice = rootDevice.replace(/\d+$/, '');
                const baseCheckDevice = device.replace(/\d+$/, '');
                
                return baseRootDevice === baseCheckDevice;
            } else if (platform === 'win32') {
                // For Windows, check if it's the C: drive equivalent
                // This is a simplified check for development
                return device.toLowerCase().includes('physicaldrive0');
            }
        } catch (error) {
            console.error('Error checking boot device:', error);
            // If we can't determine, err on the side of caution
            return true;
        }
        
        return false;
    }

    static async checkSystemDisk(device) {
        const platform = os.platform();
        
        try {
            if (platform === 'linux') {
                console.log(`Checking if ${device} is system disk...`);
                // Check if device contains important system directories
                const { stdout } = await execAsync(`lsblk -o NAME,MOUNTPOINT ${device}`);
                console.log(`lsblk raw output for ${device}:`, stdout);
                
                // Check if output contains system mount points
                const hasSystemMounts = /\/(boot|root|usr|var|\s+\/$)/.test(stdout);
                console.log(`${device} has system mounts:`, hasSystemMounts);
                return hasSystemMounts;
            } else if (platform === 'win32') {
                // For Windows, assume first physical drive is system disk
                return device.toLowerCase().includes('physicaldrive0');
            }
        } catch (error) {
            console.log(`Error checking system disk for ${device}:`, error.message);
            // If we can't determine, err on the side of caution
            return true;
        }
        
        return false;
    }

    static async getBootDeviceInfo() {
        const platform = os.platform();
        
        try {
            if (platform === 'linux') {
                const { stdout } = await execAsync(`df / | tail -1 | awk '{print $1}'`);
                return {
                    device: stdout.trim(),
                    platform: 'linux'
                };
            } else if (platform === 'win32') {
                return {
                    device: 'PhysicalDrive0',
                    platform: 'windows'
                };
            }
        } catch (error) {
            console.error('Error getting boot device info:', error);
        }
        
        return null;
    }

    static async checkWritePermissions(device) {
        const platform = os.platform();
        
        try {
            if (platform === 'linux') {
                // Check if we have write permissions to the device
                const { stdout } = await execAsync(`test -w ${device} && echo "writable"`);
                return stdout.trim() === 'writable';
            } else if (platform === 'win32') {
                // For Windows, assume we need admin privileges
                return true; // TODO: Implement proper Windows permission checking
            }
        } catch (error) {
            return false;
        }
        
        return false;
    }
}

module.exports = SafetyChecks;