@echo off
echo Building AuthCore C++ Console Example...

if exist "C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\Tools\VsDevCmd.bat" (
    echo [!] Using MSVC Compiler Community edition...
    call "C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\Tools\VsDevCmd.bat"
    cl.exe /nologo /EHsc /std:c++17 /W3 /O2 /Fe:AuthCoreConsole_Cpp.exe main.cpp AuthSdk.cpp winhttp.lib user32.lib iphlpapi.lib
    goto result
)

if exist "C:\Program Files\Microsoft Visual Studio\2022\Professional\Common7\Tools\VsDevCmd.bat" (
    echo [!] Using MSVC Compiler Professional edition...
    call "C:\Program Files\Microsoft Visual Studio\2022\Professional\Common7\Tools\VsDevCmd.bat"
    cl.exe /nologo /EHsc /std:c++17 /W3 /O2 /Fe:AuthCoreConsole_Cpp.exe main.cpp AuthSdk.cpp winhttp.lib user32.lib iphlpapi.lib
    goto result
)

where g++ >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [!] Using MinGW g++ Compiler...
    g++ -O3 -std=c++17 -o AuthCoreConsole_Cpp.exe main.cpp AuthSdk.cpp -lwinhttp -liphlpapi
    goto result
)

echo.
echo [!] Error: No compiler found.
pause
exit /b 1

:result
if %ERRORLEVEL% EQU 0 (
    echo.
    echo Build successful! Run AuthCoreConsole_Cpp.exe
) else (
    echo.
    echo Build failed.
)
pause
