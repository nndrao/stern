@echo off
setlocal

if "%~1"=="" (
    echo Usage: kill-port.bat [port_number]
    echo Example: kill-port.bat 3001
    exit /b 1
)

set PORT=%~1

echo Checking for processes on port %PORT%...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%PORT% "') do (
    set PID=%%a
    goto :kill
)

echo No process found on port %PORT%
exit /b 0

:kill
echo Found process with PID: %PID%
echo Killing process...
taskkill /F /PID %PID%

if %ERRORLEVEL% EQU 0 (
    echo Successfully killed process on port %PORT%
) else (
    echo Failed to kill process
    exit /b 1
)

exit /b 0
