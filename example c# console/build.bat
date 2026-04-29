@echo off
set "CSC=C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if not exist "%CSC%" set "CSC=C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe"

echo Compiling AuthCore Console Example...
"%CSC%" /nologo /out:AuthCoreConsole.exe /reference:System.Management.dll /reference:System.Net.Http.dll /reference:System.Web.Extensions.dll /reference:System.Windows.Forms.dll Program.cs Sdk.cs Hwid.cs

if %ERRORLEVEL% EQU 0 echo Build successful!
if %ERRORLEVEL% NEQ 0 echo Build failed.
pause
