const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

class AutoUpdater {
    constructor() {
        this.repoUrl = 'https://github.com/wslabn/securewipe.git';
        this.currentVersion = require('../package.json').version;
    }

    async checkForUpdates() {
        try {
            console.log('Checking for updates...');
            
            // Fetch latest version from GitHub API
            const response = await fetch('https://api.github.com/repos/wslabn/securewipe/releases/latest');
            const data = await response.json();
            
            const latestVersion = data.tag_name || data.name;
            console.log(`Current: ${this.currentVersion}, Latest: ${latestVersion}`);
            
            if (this.isNewerVersion(latestVersion, this.currentVersion)) {
                return {
                    updateAvailable: true,
                    currentVersion: this.currentVersion,
                    latestVersion: latestVersion,
                    downloadUrl: data.zipball_url
                };
            }
            
            return { updateAvailable: false };
        } catch (error) {
            console.error('Error checking for updates:', error);
            return { error: error.message };
        }
    }

    async performUpdate() {
        try {
            console.log('Starting auto-update...');
            
            // Create backup
            await this.createBackup();
            
            // Pull latest changes
            await execAsync('git fetch origin');
            await execAsync('git reset --hard origin/main');
            
            // Update dependencies
            await execAsync('npm install');
            
            console.log('Update completed successfully');
            return { success: true };
        } catch (error) {
            console.error('Update failed:', error);
            await this.restoreBackup();
            return { error: error.message };
        }
    }

    async createBackup() {
        const backupDir = path.join(__dirname, '../backup');
        await execAsync(`cp -r . ${backupDir}`);
        console.log('Backup created');
    }

    async restoreBackup() {
        const backupDir = path.join(__dirname, '../backup');
        await execAsync(`cp -r ${backupDir}/* .`);
        console.log('Backup restored');
    }

    isNewerVersion(latest, current) {
        const latestParts = latest.replace('v', '').split('.').map(Number);
        const currentParts = current.split('.').map(Number);
        
        for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
            const latestPart = latestParts[i] || 0;
            const currentPart = currentParts[i] || 0;
            
            if (latestPart > currentPart) return true;
            if (latestPart < currentPart) return false;
        }
        
        return false;
    }
}

module.exports = AutoUpdater;