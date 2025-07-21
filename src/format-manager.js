const { spawn } = require('child_process');
const os = require('os');

class FormatManager {
    static async formatDisk(options, progressCallback) {
        const { device, filesystem, label } = options;
        const platform = os.platform();
        
        console.log(`Starting format operation: ${filesystem} on ${device}`);
        
        if (platform === 'linux') {
            return await this.formatLinuxDisk(device, filesystem, label, progressCallback);
        } else {
            throw new Error('Real disk operations are only supported on Linux');
        }
    }

    static async formatLinuxDisk(device, filesystem, label, progressCallback) {
        try {
            // Step 1: Create partition table
            progressCallback({
                percentage: 10,
                status: 'Creating partition table...'
            });
            
            await this.createPartitionTable(device);
            
            // Step 2: Create partition
            progressCallback({
                percentage: 30,
                status: 'Creating partition...'
            });
            
            await this.createPartition(device);
            
            // Step 3: Format filesystem
            progressCallback({
                percentage: 50,
                status: `Formatting as ${filesystem}...`
            });
            
            const partitionDevice = `${device}1`; // First partition
            await this.formatPartition(partitionDevice, filesystem, label, progressCallback);
            
            progressCallback({
                percentage: 100,
                status: 'Format completed successfully'
            });
            
            return {
                success: true,
                details: `Successfully formatted ${device} as ${filesystem}${label ? ` with label "${label}"` : ''}`
            };
            
        } catch (error) {
            throw new Error(`Format failed: ${error.message}`);
        }
    }

    static async createPartitionTable(device) {
        return new Promise((resolve, reject) => {
            // Create GPT partition table
            const process = spawn('parted', [device, '--script', 'mklabel', 'gpt']);
            
            process.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Failed to create partition table (code ${code})`));
                }
            });
            
            process.on('error', (error) => {
                reject(error);
            });
        });
    }

    static async createPartition(device) {
        return new Promise((resolve, reject) => {
            // Create a single partition using all available space
            const process = spawn('parted', [device, '--script', 'mkpart', 'primary', '0%', '100%']);
            
            process.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Failed to create partition (code ${code})`));
                }
            });
            
            process.on('error', (error) => {
                reject(error);
            });
        });
    }

    static async formatPartition(partitionDevice, filesystem, label, progressCallback) {
        const formatCommand = this.getFormatCommand(filesystem, partitionDevice, label);
        
        return new Promise((resolve, reject) => {
            const process = spawn(formatCommand.command, formatCommand.args);
            
            let progressCount = 50;
            const progressInterval = setInterval(() => {
                if (progressCount < 95) {
                    progressCount += 5;
                    progressCallback({
                        percentage: progressCount,
                        status: `Formatting ${filesystem}... ${progressCount}%`
                    });
                }
            }, 1000);
            
            process.on('close', (code) => {
                clearInterval(progressInterval);
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Format command failed (code ${code})`));
                }
            });
            
            process.on('error', (error) => {
                clearInterval(progressInterval);
                reject(error);
            });
        });
    }

    static getFormatCommand(filesystem, device, label) {
        const commands = {
            ext4: {
                command: 'mkfs.ext4',
                args: ['-F', device, ...(label ? ['-L', label] : [])]
            },
            ntfs: {
                command: 'mkfs.ntfs',
                args: ['-f', device, ...(label ? ['-L', label] : [])]
            },
            fat32: {
                command: 'mkfs.fat',
                args: ['-F', '32', device, ...(label ? ['-n', label] : [])]
            },
            exfat: {
                command: 'mkfs.exfat',
                args: [device, ...(label ? ['-n', label] : [])]
            }
        };
        
        const command = commands[filesystem];
        if (!command) {
            throw new Error(`Unsupported filesystem: ${filesystem}`);
        }
        
        return command;
    }

    static async simulateFormat(device, filesystem, label, progressCallback) {
        // Simulate format operation for development/testing
        const steps = [
            'Creating partition table...',
            'Creating partition...',
            `Formatting as ${filesystem}...`,
            'Writing filesystem metadata...',
            'Finalizing...'
        ];
        
        for (let i = 0; i < steps.length; i++) {
            const baseProgress = Math.floor((i / steps.length) * 100);
            
            for (let subProgress = 0; subProgress <= 20; subProgress += 5) {
                const totalProgress = Math.min(99, baseProgress + subProgress);
                
                progressCallback({
                    percentage: totalProgress,
                    status: `${steps[i]} ${totalProgress}%`
                });
                
                // Simulate time delay (more realistic)
                await new Promise(resolve => setTimeout(resolve, 1500));
            }
        }
        
        progressCallback({
            percentage: 100,
            status: 'Simulation completed'
        });
        
        return {
            success: true,
            details: `Simulated format of ${device} as ${filesystem}${label ? ` with label "${label}"` : ''}`
        };
    }
}

module.exports = FormatManager;