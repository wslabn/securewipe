@echo off
echo ========================================
echo    Automated SecureWipe Release Builder
echo ========================================

REM Get version from user
set /p "version=Enter version (e.g., v1.0.1): "

echo.
echo Creating Git tag and pushing to trigger build...

REM Create and push tag
git tag %version%
git push origin %version%

echo.
echo ========================================
echo Build started on GitHub Actions!
echo ========================================
echo.
echo Check progress at:
echo https://github.com/wslabn/securewipe/actions
echo.
echo ISO will be available at:
echo https://github.com/wslabn/securewipe/releases/tag/%version%
echo.
echo Build takes ~15-20 minutes
pause