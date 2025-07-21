@echo off
echo ========================================
echo    SecureWipe USB Creator for Windows
echo ========================================
echo.

REM Check for admin privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script must be run as Administrator
    echo Right-click and select "Run as administrator"
    pause
    exit /b 1
)

echo Step 1: Download Ubuntu 22.04 LTS
echo ==================================
echo Please download Ubuntu 22.04 LTS Desktop ISO from:
echo https://releases.ubuntu.com/22.04/ubuntu-22.04.5-desktop-amd64.iso
echo.
set /p "iso_path=Enter full path to Ubuntu ISO file: "

if not exist "%iso_path%" (
    echo ERROR: ISO file not found: %iso_path%
    pause
    exit /b 1
)

echo.
echo Step 2: Select USB Drive
echo ========================
echo WARNING: This will COMPLETELY ERASE the selected USB drive!
echo.
wmic logicaldisk where drivetype=2 get size,freespace,caption
echo.
set /p "usb_drive=Enter USB drive letter (e.g., E): "

if not exist "%usb_drive%:\" (
    echo ERROR: Drive %usb_drive%: not found
    pause
    exit /b 1
)

echo.
echo Step 3: Confirm Operation
echo =========================
echo This will:
echo - Format USB drive %usb_drive%:
echo - Create bootable Ubuntu USB
echo - Install SecureWipe
echo.
set /p "confirm=Continue? (yes/no): "
if /i not "%confirm%"=="yes" (
    echo Operation cancelled
    pause
    exit /b 0
)

echo.
echo Step 4: Creating Bootable USB
echo ==============================

REM Download Rufus if not present
if not exist "rufus.exe" (
    echo Downloading Rufus...
    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/pbatard/rufus/releases/download/v4.2/rufus-4.2.exe' -OutFile 'rufus.exe'"
)

echo.
echo Starting Rufus to create bootable USB...
echo.
echo INSTRUCTIONS:
echo 1. Select your USB device: %usb_drive%:
echo 2. Select ISO: %iso_path%
echo 3. Partition scheme: MBR
echo 4. Target system: BIOS or UEFI
echo 5. Click START
echo 6. Wait for completion
echo 7. Close Rufus when done
echo.
start /wait rufus.exe

echo.
echo Step 5: Installing SecureWipe to USB
echo ====================================

REM Wait for USB to be ready
timeout /t 5 /nobreak >nul

REM Create SecureWipe directory on USB
if not exist "%usb_drive%:\securewipe" mkdir "%usb_drive%:\securewipe"

REM Copy SecureWipe files
echo Copying SecureWipe files...
xcopy /E /I /Y "." "%usb_drive%:\securewipe\" /EXCLUDE:exclude.txt

REM Create exclusion list for xcopy
echo node_modules\ > exclude.txt
echo .git\ >> exclude.txt
echo *.bat >> exclude.txt
echo *.iso >> exclude.txt

REM Create startup script
echo #!/bin/bash > "%usb_drive%:\start-securewipe.sh"
echo cd /media/ubuntu/*/securewipe >> "%usb_drive%:\start-securewipe.sh"
echo sudo ./install.sh >> "%usb_drive%:\start-securewipe.sh"
echo sudo ./run.sh >> "%usb_drive%:\start-securewipe.sh"

REM Create desktop shortcut
echo [Desktop Entry] > "%usb_drive%:\SecureWipe.desktop"
echo Version=1.0 >> "%usb_drive%:\SecureWipe.desktop"
echo Type=Application >> "%usb_drive%:\SecureWipe.desktop"
echo Name=SecureWipe >> "%usb_drive%:\SecureWipe.desktop"
echo Comment=Secure Disk Wiping Tool >> "%usb_drive%:\SecureWipe.desktop"
echo Exec=sudo /media/ubuntu/*/securewipe/run.sh >> "%usb_drive%:\SecureWipe.desktop"
echo Icon=/media/ubuntu/*/securewipe/icon.png >> "%usb_drive%:\SecureWipe.desktop"
echo Terminal=true >> "%usb_drive%:\SecureWipe.desktop"
echo Categories=System;Security; >> "%usb_drive%:\SecureWipe.desktop"

REM Create README
echo SecureWipe Bootable USB > "%usb_drive%:\README.txt"
echo ====================== >> "%usb_drive%:\README.txt"
echo. >> "%usb_drive%:\README.txt"
echo To use SecureWipe: >> "%usb_drive%:\README.txt"
echo 1. Boot from this USB >> "%usb_drive%:\README.txt"
echo 2. Select "Try Ubuntu" >> "%usb_drive%:\README.txt"
echo 3. Open terminal >> "%usb_drive%:\README.txt"
echo 4. Run: sudo /media/ubuntu/*/start-securewipe.sh >> "%usb_drive%:\README.txt"
echo. >> "%usb_drive%:\README.txt"
echo Or double-click SecureWipe.desktop on desktop >> "%usb_drive%:\README.txt"

REM Cleanup
del exclude.txt >nul 2>&1

echo.
echo ========================================
echo    SecureWipe USB Creation Complete!
echo ========================================
echo.
echo USB Drive: %usb_drive%:
echo Files installed to: %usb_drive%:\securewipe\
echo.
echo To use:
echo 1. Boot target computer from USB
echo 2. Select "Try Ubuntu"
echo 3. Run: sudo /media/ubuntu/*/start-securewipe.sh
echo.
echo IMPORTANT:
echo - Test on non-critical systems first
echo - Always verify target disks before wiping
echo - Keep this USB separate from target disks
echo.
pause