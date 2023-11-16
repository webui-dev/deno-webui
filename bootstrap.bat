@echo off
SETLOCAL

:: This script downloads the trusted WebUI compiled library by GitHub CI for Windows.
echo WebUI Deno Bootstrap
echo.

:: WebUI MSVC archive
SET "BASE_URL=https://github.com/webui-dev/webui/releases/download/2.4.0/webui-windows-msvc"

:: Check the CPU architecture
IF "%PROCESSOR_ARCHITECTURE%"=="x86" (
    :: x86 32Bit (webui-windows-msvc.zip)
    SET "WEBUI_MSVC_URL=%BASE_URL%.zip"
) ELSE IF "%PROCESSOR_ARCHITECTURE%"=="AMD64" (
    :: x86 64Bit (webui-windows-msvc-x64.zip)
    SET "WEBUI_MSVC_URL=%BASE_URL%-x64.zip"
) ELSE IF "%PROCESSOR_ARCHITECTURE%"=="ARM" (
    :: ARM 32Bit (webui-windows-msvc-arm.zip)
    SET "WEBUI_MSVC_URL=%BASE_URL%-arm.zip"
) ELSE IF "%PROCESSOR_ARCHITECTURE%"=="ARM64" (
    :: ARM 64Bit (webui-windows-msvc-arm64.zip)
    SET "WEBUI_MSVC_URL=%BASE_URL%-arm64.zip"
) ELSE (
    ECHO Error: Unknown architecture '%PROCESSOR_ARCHITECTURE%'
    exit /b
)

:: Creating the temporary cache folder
mkdir "cache" >nul
mkdir "cache\webui-windows-msvc-x64" >nul

:: Download the archive using PowerShell
echo * Downloading [%WEBUI_MSVC_URL%]...
powershell -Command "Invoke-WebRequest '%WEBUI_MSVC_URL%' -OutFile 'cache\webui-windows-msvc-x64.zip'"

:: Extract archive (Windows 10 and later)
echo * Extracting...
tar -xf "cache\webui-windows-msvc-x64.zip" -C "cache"

:: Copy library
echo * Copying...
mkdir "src\webui-windows-msvc-x64" >nul
copy /Y "cache\webui-windows-msvc-x64\webui-2.dll" "src\webui-windows-msvc-x64\webui-2.dll" >nul

:: Remove cache folder
echo * Cleaning...
rmdir /S /Q "cache" >nul

ENDLOCAL
