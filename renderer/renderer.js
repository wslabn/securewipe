class SecureWipeApp {
    constructor() {
        this.selectedDisk = null;
        this.currentOperation = null;
        this.init();
    }

    async init() {
        await this.loadPlatformInfo();
        await this.loadDisks();
        this.setupEventListeners();
        this.setupProgressListeners();
    }

    async loadPlatformInfo() {
        const platform = await window.electronAPI.getPlatform();
        document.getElementById('platformInfo').textContent = `Platform: ${platform}`;
    }

    async loadDisks() {
        const diskList = document.getElementById('diskList');
        diskList.innerHTML = '<div class="loading">Loading available disks...</div>';

        try {
            const result = await window.electronAPI.getDisks();
            
            if (result.error) {
                diskList.innerHTML = `<div class="error">Error: ${result.error}</div>`;
                return;
            }

            if (!result.disks || result.disks.length === 0) {
                diskList.innerHTML = '<div class="loading">No disks found</div>';
                return;
            }

            diskList.innerHTML = '';
            result.disks.forEach(disk => {
                const diskElement = this.createDiskElement(disk);
                diskList.appendChild(diskElement);
            });
        } catch (error) {
            console.error('Error loading disks:', error);
            diskList.innerHTML = `<div class="error">Error loading disks: ${error.message}</div>`;
        }
    }

    createDiskElement(disk) {
        const diskDiv = document.createElement('div');
        diskDiv.className = 'disk-item';
        diskDiv.dataset.device = disk.device;
        
        diskDiv.innerHTML = `
            <div class="disk-name">${disk.device} - ${disk.model || 'Unknown Model'}</div>
            <div class="disk-details">
                Size: ${this.formatBytes(disk.size)} | 
                Type: ${disk.type || 'Unknown'} |
                ${disk.mounted ? '⚠️ Mounted' : '✅ Available'}
            </div>
        `;

        diskDiv.addEventListener('click', () => this.selectDisk(disk, diskDiv));
        return diskDiv;
    }

    async selectDisk(disk, element) {
        // Remove previous selection
        document.querySelectorAll('.disk-item').forEach(item => {
            item.classList.remove('selected');
        });

        // Select current disk
        element.classList.add('selected');
        this.selectedDisk = disk;

        // Load detailed disk info
        await this.loadDiskInfo(disk.device);
        
        // Show operation section
        document.getElementById('operationSection').style.display = 'block';
    }

    async loadDiskInfo(devicePath) {
        const diskInfoSection = document.getElementById('diskInfoSection');
        const diskInfoDiv = document.getElementById('diskInfo');
        
        try {
            const info = await window.electronAPI.getDiskInfo(devicePath);
            
            if (info.error) {
                diskInfoDiv.innerHTML = `<div class="error">Error: ${info.error}</div>`;
                return;
            }

            diskInfoDiv.innerHTML = `
                <div class="info-row">
                    <span class="info-label">Device:</span>
                    <span>${info.device}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Size:</span>
                    <span>${this.formatBytes(info.size)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Model:</span>
                    <span>${info.model || 'Unknown'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">File System:</span>
                    <span>${info.filesystem || 'Unknown'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Mount Status:</span>
                    <span>${info.mounted ? '⚠️ Mounted' : '✅ Unmounted'}</span>
                </div>
            `;

            diskInfoSection.style.display = 'block';
        } catch (error) {
            console.error('Error loading disk info:', error);
            diskInfoDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
        }
    }

    setupEventListeners() {
        // Refresh disks button
        document.getElementById('refreshDisks').addEventListener('click', () => {
            this.loadDisks();
        });

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Start operation button
        document.getElementById('startOperation').addEventListener('click', () => {
            this.startOperation();
        });

        // Cancel operation button
        document.getElementById('cancelOperation').addEventListener('click', () => {
            this.cancelOperation();
        });

        // Start new operation button
        document.getElementById('startNew').addEventListener('click', () => {
            this.resetApp();
        });
    }

    setupProgressListeners() {
        window.electronAPI.onWipeProgress((event, progress) => {
            this.updateProgress(progress);
        });

        window.electronAPI.onFormatProgress((event, progress) => {
            this.updateProgress(progress);
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}Tab`).classList.add('active');
    }

    async startOperation() {
        if (!this.selectedDisk) {
            alert('Please select a disk first');
            return;
        }

        const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
        const confirmMessage = `Are you sure you want to ${activeTab} ${this.selectedDisk.device}?\n\nThis will permanently destroy all data on the disk!`;
        
        const confirmed = await window.electronAPI.showConfirmation(confirmMessage);
        if (!confirmed) return;

        // Hide operation section and show progress
        document.getElementById('operationSection').style.display = 'none';
        document.getElementById('progressSection').style.display = 'block';

        const options = this.getOperationOptions(activeTab);
        
        try {
            let result;
            if (activeTab === 'wipe') {
                this.currentOperation = 'wipe';
                result = await window.electronAPI.wipeDisk(options);
            } else {
                this.currentOperation = 'format';
                result = await window.electronAPI.formatDisk(options);
            }

            this.showResults(result);
        } catch (error) {
            console.error('Operation error:', error);
            this.showResults({ error: error.message });
        }
    }

    getOperationOptions(operation) {
        const options = {
            device: this.selectedDisk.device,
            operation: operation
        };

        if (operation === 'wipe') {
            options.method = document.getElementById('wipeMethod').value;
            options.formatAfter = document.getElementById('formatAfterWipe').checked;
            if (options.formatAfter) {
                options.filesystem = 'ext4'; // Default for after wipe
            }
        } else {
            options.filesystem = document.getElementById('fileSystem').value;
            options.label = document.getElementById('volumeLabel').value;
        }

        return options;
    }

    updateProgress(progress) {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const statusText = document.getElementById('operationStatus');

        progressFill.style.width = `${progress.percentage}%`;
        progressText.textContent = `${progress.percentage}%`;
        statusText.textContent = progress.status || 'Processing...';
    }

    showResults(result) {
        document.getElementById('progressSection').style.display = 'none';
        document.getElementById('resultsSection').style.display = 'block';

        const resultsDiv = document.getElementById('results');
        
        if (result.error) {
            resultsDiv.className = 'results error';
            resultsDiv.innerHTML = `
                <h3>❌ Operation Failed</h3>
                <p>${result.error}</p>
            `;
        } else {
            resultsDiv.className = 'results';
            resultsDiv.innerHTML = `
                <h3>✅ Operation Completed Successfully</h3>
                <p>The ${this.currentOperation} operation completed successfully.</p>
                ${result.details ? `<p><strong>Details:</strong> ${result.details}</p>` : ''}
            `;
        }
    }

    cancelOperation() {
        // TODO: Implement operation cancellation
        console.log('Cancel operation requested');
    }

    resetApp() {
        // Hide all sections except disk selection
        document.getElementById('diskInfoSection').style.display = 'none';
        document.getElementById('operationSection').style.display = 'none';
        document.getElementById('progressSection').style.display = 'none';
        document.getElementById('resultsSection').style.display = 'none';

        // Reset selections
        this.selectedDisk = null;
        this.currentOperation = null;
        
        // Remove disk selections
        document.querySelectorAll('.disk-item').forEach(item => {
            item.classList.remove('selected');
        });

        // Refresh disk list
        this.loadDisks();
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SecureWipeApp();
});