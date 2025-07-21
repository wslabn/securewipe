class SecureWipeApp {
    constructor() {
        this.selectedDisks = [];
        this.currentOperation = null;
        this.systemDisk = null;
        this.maxDiskSelection = 8; // Reasonable limit for parallel operations
        this.init();
    }

    async init() {
        await this.loadPlatformInfo();
        await this.loadSystemDisk();
        await this.loadDisks();
        this.setupEventListeners();
        this.setupProgressListeners();
    }

    async loadSystemDisk() {
        try {
            const result = await window.electronAPI.getSystemDisk();
            this.systemDisk = result.device;
        } catch (error) {
            console.error('Error loading system disk:', error);
        }
    }

    async loadPlatformInfo() {
        const platform = await window.electronAPI.getPlatform();
        document.getElementById('platformInfo').textContent = `Platform: ${platform}`;
    }

    async loadDisks() {
        const diskList = document.getElementById('diskList');
        diskList.innerHTML = '<div class="loading">Loading available disks...</div>';

        try {
            // Update splash screen status
            await window.electronAPI.updateSplashStatus('Detecting available disks...');
            
            const result = await window.electronAPI.getDisks();
            
            // Update splash screen status
            await window.electronAPI.updateSplashStatus('Processing disk information...');
            
            if (result.error) {
                diskList.innerHTML = `<div class="error">Error: ${result.error}</div>`;
                return;
            }

            if (!result.disks || result.disks.length === 0) {
                diskList.innerHTML = '<div class="loading">No disks found</div>';
                return;
            }

            // Update splash screen status
            await window.electronAPI.updateSplashStatus('Preparing interface...');
            
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
        const isSystemDisk = disk.isSystemDisk || (this.systemDisk && disk.device.includes(this.systemDisk.replace(/\d+$/, '')));
        
        diskDiv.className = `disk-item ${isSystemDisk ? 'system-disk' : ''}`;
        diskDiv.dataset.device = disk.device;
        
        let statusText = '';
        if (isSystemDisk) {
            statusText = '🚫 System Disk (Protected)';
        } else if (disk.mounted) {
            statusText = '⚠️ Mounted';
        } else {
            statusText = '✅ Available';
        }
        
        diskDiv.innerHTML = `
            <div class="disk-header">
                <input type="checkbox" class="disk-checkbox" ${isSystemDisk ? 'disabled' : ''} data-device="${disk.device}">
                <div class="disk-name">${disk.device} - ${disk.model || 'Unknown Model'}</div>
            </div>
            <div class="disk-details">
                Size: ${this.formatBytes(disk.size)} | 
                Type: ${disk.type || 'Unknown'} |
                ${statusText}
            </div>
        `;

        const checkbox = diskDiv.querySelector('.disk-checkbox');
        if (!isSystemDisk) {
            checkbox.addEventListener('change', (e) => this.toggleDiskSelection(disk, e.target.checked));
        }
        
        return diskDiv;
    }

    toggleDiskSelection(disk, isSelected) {
        if (isSelected) {
            if (this.selectedDisks.length >= this.maxDiskSelection) {
                // Uncheck the checkbox and show warning
                const checkbox = document.querySelector(`[data-device="${disk.device}"]`);
                checkbox.checked = false;
                alert(`Maximum ${this.maxDiskSelection} disks can be selected for simultaneous processing.`);
                return;
            }
            if (!this.selectedDisks.find(d => d.device === disk.device)) {
                this.selectedDisks.push(disk);
            }
        } else {
            this.selectedDisks = this.selectedDisks.filter(d => d.device !== disk.device);
        }
        
        this.updateSelectionDisplay();
        this.updateDiskCheckboxStates();
    }

    updateDiskCheckboxStates() {
        const checkboxes = document.querySelectorAll('.disk-checkbox:not([disabled])');
        const limitReached = this.selectedDisks.length >= this.maxDiskSelection;
        
        checkboxes.forEach(checkbox => {
            if (!checkbox.checked) {
                checkbox.disabled = limitReached;
                const diskItem = checkbox.closest('.disk-item');
                if (limitReached) {
                    diskItem.classList.add('limit-reached');
                } else {
                    diskItem.classList.remove('limit-reached');
                }
            }
        });
    }

    async updateSelectionDisplay() {
        const diskInfoSection = document.getElementById('diskInfoSection');
        const operationSection = document.getElementById('operationSection');
        
        if (this.selectedDisks.length === 0) {
            diskInfoSection.style.display = 'none';
            operationSection.style.display = 'none';
            return;
        }
        
        // Show selected disks info
        await this.loadSelectedDisksInfo();
        diskInfoSection.style.display = 'block';
        operationSection.style.display = 'block';
    }

    async loadSelectedDisksInfo() {
        const diskInfoDiv = document.getElementById('diskInfo');
        
        if (this.selectedDisks.length === 1) {
            // Single disk - show detailed info
            const disk = this.selectedDisks[0];
            try {
                const info = await window.electronAPI.getDiskInfo(disk.device);
                
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
            } catch (error) {
                diskInfoDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
            }
        } else {
            // Multiple disks - show summary
            const totalSize = this.selectedDisks.reduce((sum, disk) => sum + disk.size, 0);
            diskInfoDiv.innerHTML = `
                <div class="info-row">
                    <span class="info-label">Selected Disks:</span>
                    <span>${this.selectedDisks.length}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Total Size:</span>
                    <span>${this.formatBytes(totalSize)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Selection Limit:</span>
                    <span>${this.selectedDisks.length}/${this.maxDiskSelection}</span>
                </div>
                <div class="selected-disks-list">
                    ${this.selectedDisks.map(disk => `
                        <div class="selected-disk-item">
                            ${disk.device} - ${disk.model || 'Unknown'} (${this.formatBytes(disk.size)})
                        </div>
                    `).join('')}
                </div>
            `;
        }
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

        // Format after wipe checkbox
        document.getElementById('formatAfterWipe').addEventListener('change', (e) => {
            const formatOptions = document.getElementById('formatAfterWipeOptions');
            formatOptions.style.display = e.target.checked ? 'block' : 'none';
        });

        // Cancel operation button
        document.getElementById('cancelOperation').addEventListener('click', () => {
            this.cancelOperation();
        });

        // Cancel operation button in modal
        document.getElementById('cancelOperationModal').addEventListener('click', () => {
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
        
        window.electronAPI.onMultiDiskProgress((event, progress) => {
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
        if (this.selectedDisks.length === 0) {
            alert('Please select at least one disk first');
            return;
        }

        const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
        const options = this.getOperationOptions(activeTab);
        
        const diskList = this.selectedDisks.map(d => d.device).join(', ');
        let confirmMessage = `Are you sure you want to ${activeTab} ${this.selectedDisks.length} disk(s)?\n\nDisks: ${diskList}`;
        
        if (activeTab === 'wipe' && options.formatAfter) {
            confirmMessage += `\n\nOperation: Wipe (${options.method}) + Format (${options.filesystem})`;
        } else if (activeTab === 'wipe') {
            confirmMessage += `\n\nWipe method: ${options.method}`;
        } else {
            confirmMessage += `\n\nFormat to: ${options.filesystem}`;
        }
        
        confirmMessage += `\n\nThis will permanently destroy all data on the selected disks!`;
        
        const confirmed = await window.electronAPI.showConfirmation(confirmMessage);
        if (!confirmed) return;

        // Show progress modal
        this.showProgressModal();
        
        try {
            this.currentOperation = activeTab;
            const result = await window.electronAPI.processMultipleDisks({
                disks: this.selectedDisks,
                operation: activeTab,
                ...options
            });

            this.showResults(result);
        } catch (error) {
            console.error('Operation error:', error);
            this.showResults({ error: error.message });
        }
    }

    getOperationOptions(operation) {
        const options = {
            operation: operation
        };

        if (operation === 'wipe') {
            options.method = document.getElementById('wipeMethod').value;
            options.formatAfter = document.getElementById('formatAfterWipe').checked;
            if (options.formatAfter) {
                options.filesystem = document.getElementById('wipeFormatSystem').value;
                options.label = document.getElementById('wipeVolumeLabel').value;
            }
        } else {
            options.filesystem = document.getElementById('fileSystem').value;
            options.label = document.getElementById('volumeLabel').value;
        }

        return options;
    }

    showProgressModal() {
        const modal = document.getElementById('progressModal');
        const progressList = document.getElementById('diskProgressList');
        
        // Initialize progress for each disk
        progressList.innerHTML = '';
        this.diskProgress = {};
        
        this.selectedDisks.forEach(disk => {
            this.diskProgress[disk.device] = 0;
            const progressItem = document.createElement('div');
            progressItem.className = 'disk-progress-item';
            progressItem.id = `progress-${disk.device.replace(/[^a-zA-Z0-9]/g, '')}`;
            
            progressItem.innerHTML = `
                <div class="disk-progress-header">
                    <div class="disk-name">${disk.device}</div>
                    <div class="disk-actions">
                        <div class="disk-status">Starting...</div>
                        <button class="btn-cancel-disk" data-device="${disk.device}">✕</button>
                    </div>
                </div>
                <div class="disk-progress-bar">
                    <div class="disk-progress-fill" style="width: 0%"></div>
                </div>
            `;
            
            // Add cancel event listener
            const cancelBtn = progressItem.querySelector('.btn-cancel-disk');
            cancelBtn.addEventListener('click', () => this.cancelIndividualDisk(disk.device));
            
            progressList.appendChild(progressItem);
        });
        
        modal.style.display = 'flex';
    }
    
    hideProgressModal() {
        document.getElementById('progressModal').style.display = 'none';
    }

    updateProgress(progress) {
        const deviceId = progress.device.replace(/[^a-zA-Z0-9]/g, '');
        const progressItem = document.getElementById(`progress-${deviceId}`);
        
        if (progressItem && !progressItem.classList.contains('cancelled')) {
            const statusEl = progressItem.querySelector('.disk-status');
            const fillEl = progressItem.querySelector('.disk-progress-fill');
            
            statusEl.textContent = `${progress.percentage}% - ${progress.status || 'Processing...'}`;
            fillEl.style.width = `${progress.percentage}%`;
            
            this.diskProgress[progress.device] = progress.percentage;
        }
    }

    showResults(result) {
        this.hideProgressModal();
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

    async cancelIndividualDisk(device) {
        const confirmed = await window.electronAPI.showConfirmation(`Cancel operation for ${device}?\n\nOther disks will continue processing.`);
        if (!confirmed) return;
        
        try {
            await window.electronAPI.cancelDiskOperation(device);
            
            // Update UI to show cancelled status
            const deviceId = device.replace(/[^a-zA-Z0-9]/g, '');
            const progressItem = document.getElementById(`progress-${deviceId}`);
            if (progressItem) {
                const statusEl = progressItem.querySelector('.disk-status');
                const cancelBtn = progressItem.querySelector('.btn-cancel-disk');
                const fillEl = progressItem.querySelector('.disk-progress-fill');
                
                progressItem.classList.add('cancelled');
                statusEl.textContent = 'Cancelled';
                statusEl.style.color = '#e53e3e';
                cancelBtn.disabled = true;
                cancelBtn.textContent = '✓';
                fillEl.style.background = '#fed7d7';
                progressItem.style.opacity = '0.6';
            }
        } catch (error) {
            console.error('Error cancelling disk operation:', error);
        }
    }

    cancelOperation() {
        // TODO: Implement operation cancellation
        console.log('Cancel operation requested');
    }

    resetApp() {
        // Hide all sections except disk selection
        this.hideProgressModal();
        document.getElementById('diskInfoSection').style.display = 'none';
        document.getElementById('operationSection').style.display = 'none';
        document.getElementById('progressSection').style.display = 'none';
        document.getElementById('resultsSection').style.display = 'none';

        // Reset selections
        this.selectedDisks = [];
        this.currentOperation = null;
        
        // Uncheck all disk checkboxes and reset states
        document.querySelectorAll('.disk-checkbox').forEach(checkbox => {
            checkbox.checked = false;
            checkbox.disabled = false;
        });
        document.querySelectorAll('.disk-item').forEach(item => {
            item.classList.remove('limit-reached');
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