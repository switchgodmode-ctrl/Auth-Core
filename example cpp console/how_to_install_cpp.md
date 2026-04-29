# How to Install g++ on Windows (MSYS2)

Follow these steps to get a professional C++ compiler on your system:

### 1. Download MSYS2
Go to **[msys2.org](https://www.msys2.org/)** and download the installer (usually named `msys2-x86_64-XXXXXXXX.exe`).

### 2. Install MSYS2
Run the installer and follow the prompts. Use the default installation path: `C:\msys64`.

### 3. Install the Compiler
When the installation finishes, a terminal will open. Type this command and press Enter:
```bash
pacman -S mingw-w64-ucrt-x86_64-gcc
```
*When asked to confirm, type `Y` and press Enter.*

### 4. Add to System PATH (CRITICAL)
For the build script to find `g++`, you must add it to your Windows Environment Variables:
1. Press the **Windows Key** and type "Environment Variables".
2. Select **"Edit the system environment variables"**.
3. Click **"Environment Variables..."** at the bottom.
4. Under **"User variables"**, select **Path** and click **Edit**.
5. Click **New** and paste this path: `C:\msys64\ucrt64\bin`
6. Click **OK** on all windows.

### 5. Verify Installation
Open a **new** terminal (Command Prompt or PowerShell) and type:
```bash
g++ --version
```
If you see a version number, you're ready! Tell me "I'm ready" and I will build the C++ project.
