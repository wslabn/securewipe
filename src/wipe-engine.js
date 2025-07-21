const { spawn } = require('child_process');
const os = require('os');
const fs = require('fs').promises;

class WipeEngine {
    static async wipeDisk(options, progressCallback, abortSignal) {
        const { device, method } = options;
        const platform = os.platform();
        
        console.log(`Platform detected: ${platform}`);
        console.log(`Starting wipe operation: ${method} on ${device}`);
        
        if (platform === 'linux') {
            console.log('Using Linux real disk operations');
            return await this.wipeLinuxDisk(device, method, progressCallback, abortSignal);
        } else {
            console.log('Platform not Linux, throwing error');
            throw new Error('Real disk operations are only supported on Linux');
        }
    }

    static async wipeLinuxDisk(device, method, progressCallback, abortSignal) {
        console.log(`Starting real wipe operation: ${method} on ${device}`);
        
        // Get disk size for accurate progress calculation
        const { execAsync } = require('util').promisify(require('child_process').exec);
        const { stdout } = await execAsync(`blockdev --getsize64 ${device}`);
        const diskSize = parseInt(stdout.trim());
        console.log(`Disk size: ${diskSize} bytes`);
        
        const wipeCommands = this.getWipeCommands(device, method);
        console.log(`Will execute ${wipeCommands.length} passes`);
        
        for (let i = 0; i < wipeCommands.length; i++) {
            // Check if operation was cancelled
            if (abortSignal && abortSignal.aborted) {
                throw new Error('Operation cancelled');
            }
            
            const command = wipeCommands[i];
            const passNumber = i + 1;
            
            console.log(`Starting pass ${passNumber}/${wipeCommands.length}: ${command.command} ${command.args.join(' ')}`);
            
            progressCallback({
                percentage: Math.floor((i / wipeCommands.length) * 100),
                status: `Pass ${passNumber}/${wipeCommands.length}: ${command.description}`
            });
            
            try {
                await this.executeWipeCommand(command, progressCallback, passNumber, wipeCommands.length, abortSignal, diskSize);
                console.log(`Completed pass ${passNumber}`);
            } catch (error) {
                console.error(`Pass ${passNumber} failed:`, error.message);
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
                    args: [`if=/dev/urandom`, `of=${device}`, 'bs=1M', 'oflag=sync', 'status=progress'],
                    description: 'Random data pass'
                }];
                
            case 'zero':
                return [{
                    command: 'dd',
                    args: [`if=/dev/zero`, `of=${device}`, 'bs=1M', 'oflag=sync', 'status=progress'],
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

    static async executeWipeCommand(command, progressCallback, passNumber, totalPasses, abortSignal, diskSize) {
        console.log(`Executing: ${command.command} ${command.args.join(' ')}`);
        return new Promise((resolve, reject) => {
            const process = spawn(command.command, command.args);
            let aborted = false;
            
            console.log(`Process started with PID: ${process.pid}`);
            console.log(`Disk size for progress: ${diskSize} bytes`);
            
            // Handle abort signal
            if (abortSignal) {
                abortSignal.addEventListener('abort', () => {
                    aborted = true;
                    process.kill('SIGTERM');
                    reject(new Error('Operation cancelled'));
                });
            }
            
            let lastProgress = 0;
            
            process.stdout.on('data', (data) => {
                if (aborted) return;
                console.log('STDOUT:', data.toString());
            });
            

            
            let stderrOutput = '';
            
            process.stderr.on('data', (data) => {
                if (aborted) return;
                
                const output = data.toString();
                stderrOutput += output;
                console.log('STDERR:', output);
                
                // Parse dd progress output
                const progressMatch = output.match(/(\d+)\s+bytes.*copied/);
                if (progressMatch) {
                    const bytes = parseInt(progressMatch[1]);
                    // Calculate actual progress based on disk size
                    const passProgress = Math.min(99, Math.floor((bytes / diskSize) * 100));
                    
                    if (passProgress > lastProgress) {
                        lastProgress = passProgress;
                        // Calculate overall progress across all passes
                        const overallProgress = Math.floor(((passNumber - 1) / totalPasses * 100) + (passProgress / totalPasses));
                        
                        progressCallback({
                            percentage: overallProgress,
                            status: `${command.description} - Pass ${passNumber}/${totalPasses} - ${passProgress}%`
                        });
                    }
                }
            });
            
            process.on('close', (code) => {
                console.log(`Process closed with code: ${code}`);
                if (aborted) return;
                
                // Exit code 1 with "No space left on device" means successful wipe
                const isSuccessfulWipe = code === 1 && stderrOutput.includes('No space left on device');
                
                if (code === 0 || isSuccessfulWipe) {
                    console.log('Command completed successfully');
                    resolve();
                } else {
                    console.error(`Command failed with exit code: ${code}`);
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
            for (let progress = 0; progress <= 100; progress += 5) {
                if (abortSignal && abortSignal.aborted) {
                    throw new Error('Operation cancelled');
                }
                
                const overallProgress = Math.floor(((step - 1) / totalSteps * 100) + (progress / totalSteps));
                
                progressCallback({
                    percentage: overallProgress,
                    status: `Simulating ${method} wipe - Pass ${step}/${totalSteps} - ${progress}%`
                });
                
                // Simulate time delay (more realistic)
                await new Promise(resolve => setTimeout(resolve, 2000));
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