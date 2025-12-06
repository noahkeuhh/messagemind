# Installing Node.js on Windows

Node.js is required to run the backend. Follow these steps:

## Option 1: Install Node.js Directly (Recommended)

1. **Download Node.js:**
   - Go to https://nodejs.org/
   - Download the **LTS (Long Term Support)** version (recommended)
   - Choose the Windows Installer (.msi) for your system (64-bit or 32-bit)

2. **Run the Installer:**
   - Double-click the downloaded `.msi` file
   - Follow the installation wizard
   - ✅ **Important:** Check "Add to PATH" option (should be checked by default)
   - Click "Install"

3. **Verify Installation:**
   - Close and reopen your terminal/PowerShell
   - Run these commands:
   ```powershell
   node --version
   npm --version
   ```
   - You should see version numbers (e.g., `v20.10.0` and `10.2.3`)

## Option 2: Install via Chocolatey (If you have it)

If you have Chocolatey package manager installed:

```powershell
choco install nodejs-lts
```

## Option 3: Install via Winget (Windows 10/11)

```powershell
winget install OpenJS.NodeJS.LTS
```

## After Installation

1. **Close and reopen your terminal** (important for PATH to update)

2. **Navigate to the backend folder:**
   ```powershell
   cd backend
   ```

3. **Install dependencies:**
   ```powershell
   npm install
   ```

4. **Verify it worked:**
   ```powershell
   npm --version
   ```

## Troubleshooting

**If npm is still not recognized after installation:**

1. Restart your computer (sometimes required for PATH changes)
2. Or manually add Node.js to PATH:
   - Open "Environment Variables" in Windows
   - Add `C:\Program Files\nodejs\` to your PATH
   - Restart terminal

**Check if Node.js is installed but not in PATH:**
```powershell
# Check if Node.js exists in default location
Test-Path "C:\Program Files\nodejs\node.exe"
```

If this returns `True`, Node.js is installed but not in PATH. Restart your terminal or add it manually.

## What Version Do I Need?

- **Minimum:** Node.js 18.x or higher
- **Recommended:** Node.js 20.x LTS (Long Term Support)

The installer will automatically install npm (Node Package Manager) along with Node.js.



