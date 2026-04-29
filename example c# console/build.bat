@echo off
set CSC="C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"

if not exist %CSC% (
    set CSC="C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe"
)

if not exist %CSC% (
    echo Error: .NET Framework compiler (csc.exe) not found!
    pause
    exit /b 1
)

echo Compiling AuthCore Console Example...

%CSC% /nologo /out:AuthCoreConsole.exe /reference:System.Management.dll /reference:System.Net.Http.dll /reference:System.Web.Extensions.dll /reference:System.Windows.Forms.dll Program.cs Sdk.cs Hwid.cs

if %ERRORLEVEL% == 0 (
    echo.
    echo Build successful! Run AuthCoreConsole.exe to test.
) else (
    echo.
    echo Build failed.
)
pause
