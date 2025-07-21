const { spawn } = require('child_process');
const os = require('os');
const fs = require('fs').promises;

class WipeEngine {
    static async wipeDisk(options, progressCallback, abortSignal) {
        const { device, method } = options;
        const platform = os.platform();
        
        console.log(`Starting wipe operation: ${method} on ${device}`);
        
        if (platform === 'linux') {
            return await this.wipeLinuxDisk(device, method, progressCallback, abortSignal);
        } else {
            // For development on Windows, simulate the operation
            return await this.simulateWipe(device, method, progressCallback, abortSignal);
        }
    }

    static async wipeLinuxDisk(device, method, progressCallback, abortSignal) {
        const wipeCommands = this.getWipeCommands(device, method);
        
        for (let i = 0; i < wipeCommands.length; i++) {
            // Check if operation was cancelled
            if (abortSignal && abortSignal.aborted) {
                throw new Error('Operation cancelled');
            }
            
            const command = wipeCommands[i];
            const passNumber = i + 1;
            
            progressCallback({
                percentage: Math.floor((i / wipeCommands.length) * 100),
                status: `Pass ${passNumber}/${wipeCommands.length}: ${command.description}`
            });
            
            try {
                await this.executeWipeCommand(command, progressCallback, passNumber, wipeCommands.length, abortSignal);
            } catch (error) {
                if (error.message === 'Operation cancelled') {
                    throw error; // Propagate cancellation
                }
                throw new Error(`Wipe failed on pass ${passNumber}: ${error.message}`);
            }
        }
        
        progressCallback({
            percentage: 100,
            status: 'Wipe completed successfully'
        });
        
        return {
            success: true,
            details: `Successfully wiped ${device} using ${method} method`
        };
    }

    static getWipeCommands(device, method) {
        switch (method) {
            case 'random':
                return [{
                    command: 'dd',
                    args: [`if=/dev/urandom`, `of=${device}`, 'bs=1M', 'status=progress'],
                    description: 'Random data pass'
                }];
                
            case 'zero':
                return [{
                    command: 'dd',
                    args: [`if=/dev/zero`, `of=${device}`, 'bs=1M', 'status=progress'],
                    description: 'Zero fill pass'
                }];
                
            case 'dod':
                return [
                    {
                        command: 'dd',
                        args: [`if=/dev/zero`, `of=${device}`, 'bs=1M', 'status=progress'],
                        description: 'DoD Pass 1: Zero fill'
                    },
                    {
                        command: 'dd',
                        args: [`if=/dev/urandom`, `of=${device}`, 'bs=1M', 'status=progress'],
                        description: 'DoD Pass 2: Random data'
                    },
                    {
                        command: 'dd',
                        args: [`if=/dev/zero`, `of=${device}`, 'bs=1M', 'status=progress'],
                        description: 'DoD Pass 3: Zero fill'
                    }
                ];
                
            case 'gutmann':
                // Simplified Gutmann method (normally 35 passes)
                const passes = [];
                for (let i = 1; i <= 35; i++) {
                    passes.push({
                        command: 'dd',
                        args: [`if=/dev/urandom`, `of=${device}`, 'bs=1M', 'status=progress'],
                        description: `Gutmann Pass ${i}/35`
                    });
                }
                return passes;
                
            default:
                throw new Error(`Unknown wipe method: ${method}`);
        }
    }

    static async executeWipeCommand(command, progressCallback, passNumber, totalPasses, abortSignal) {
        return new Promise((resolve, reject) => {
            const process = spawn(command.command, command.args);
            let aborted = false;
            
            // Handle abort signal
            if (abortSignal) {
                abortSignal.addEventListener('abort', () => {
                    aborted = true;
                    process.kill('SIGTERM');
                    reject(new Error('Operation cancelled'));
                });
            }
            
            let lastProgress = 0;
            
            process.stderr.on('data', (data) => {
                if (aborted) return;
                
                const output = data.toString();
                
                // Parse dd progress output
                const progressMatch = output.match(/(\d+)\s+bytes.*copied/);
                if (progressMatch) {
                    const bytes = parseInt(progressMatch[1]);
                    // This is a simplified progress calculation
                    const progress = Math.min(99, Math.floor(bytes / 1000000)); // Rough estimate
                    
                    if (progress > lastProgress) {
                        lastProgress = progress;
                        const overallProgress = Math.floor(((passNumber - 1) / totalPasses * 100) + (progress / totalPasses));
                        
                        progressCallback({
                            percentage: overallProgress,
                            status: `${command.description} - ${progress}%`
                        });
                    }
                }
            });
            
            process.on('close', (code) => {
                if (aborted) return;
                
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Command failed with code ${code}`));
                }
            });
            
            process.on('error', (error) => {
                if (aborted) return;
                reject(error);
            });
        });
    }

    static async simulateWipe(device, method, progressCallback, abortSignal) {
        // Simulate wipe operation for development/testing
        const totalSteps = method === 'gutmann' ? 35 : method === 'dod' ? 3 : 1;
        
        for (let step = 1; step <= totalSteps; step++) {
            for (let progress = 0; progress <= 100; progress += 10) {
                if (abortSignal && abortSignal.aborted) {
                    throw new Error('Operation cancelled');
                }
                
                const overallProgress = Math.floor(((step - 1) / totalSteps * 100) + (progress / totalSteps));
                
                progressCallback({
                    percentage: overallProgress,
                    status: `Simulating ${method} wipe - Pass ${step}/${totalSteps} - ${progress}%`
                });
                
                // Simulate time delay
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        progressCallback({
            percentage: 100,
            status: 'Simulation completed'
        });
        
        return {
            success: true,
            details: `Simulated wipe of ${device} using ${method} method`
        };
    }
}

module.exports = WipeEngine;