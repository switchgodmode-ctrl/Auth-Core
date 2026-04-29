@echo off
set "PATH=%PATH%;C:\msys64\ucrt64\bin"
echo Building AuthCore C++ Console Example...

:: Try MSVC first
if exist "C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\Tools\VsDevCmd.bat" (
    echo [!] Using MSVC Compiler...
    call "C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\Tools\VsDevCmd.bat"
    cl.exe /nologo /EHsc /W3 /O2 /Fe:AuthCoreConsole_Cpp.exe main.cpp AuthSdk.cpp winhttp.lib user32.lib
    goto result
)

:: Try g++ second
where g++ >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [!] Using MinGW g++ Compiler...
    g++ -O3 -o AuthCoreConsole_Cpp.exe main.cpp AuthSdk.cpp -lwinhttp
    goto result
)

echo.
echo [!] Error: No compiler found (cl.exe or g++). 
echo [!] Please install g++ following the guide in how_to_install_cpp.md
pause
exit /b 1

:result
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Build successful! Run AuthCoreConsole_Cpp.exe
    echo ========================================
) else (
    echo.
    echo Build failed.
)
pause
