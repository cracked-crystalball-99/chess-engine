# PowerShell script to download Stockfish WASM and JS wrapper for browser
# This script fetches the latest release from the official Stockfish GitHub repository

$ErrorActionPreference = 'Stop'

# Set the download directory to the current script location
$downloadDir = Split-Path -Parent $MyInvocation.MyCommand.Definition

# Get the latest release info from GitHub API
$releaseInfo = Invoke-RestMethod -Uri "https://api.github.com/repos/official-stockfish/Stockfish/releases/latest"


# Try to find exact asset names first
$wasmAsset = $releaseInfo.assets | Where-Object { $_.name -eq 'stockfish.wasm' } | Select-Object -First 1
$jsAsset = $releaseInfo.assets | Where-Object { $_.name -eq 'stockfish.js' } | Select-Object -First 1

# Fallback: find any .wasm or .js asset if exact names not found
if (-not $wasmAsset) {
    $wasmAsset = $releaseInfo.assets | Where-Object { $_.name -like '*.wasm' } | Select-Object -First 1
}
if (-not $jsAsset) {
    $jsAsset = $releaseInfo.assets | Where-Object { $_.name -like '*.js' } | Select-Object -First 1
}

if (-not $wasmAsset -or -not $jsAsset) {
    Write-Error "Could not find Stockfish WASM or JS assets in the latest release. Please check the release page manually."
    exit 1
}

# Download the WASM file
$wasmPath = Join-Path $downloadDir $wasmAsset.name
Invoke-WebRequest -Uri $wasmAsset.browser_download_url -OutFile $wasmPath
Write-Host "Downloaded: $wasmAsset.name"

# Download the JS wrapper
$jsPath = Join-Path $downloadDir $jsAsset.name
Invoke-WebRequest -Uri $jsAsset.browser_download_url -OutFile $jsPath
Write-Host "Downloaded: $jsAsset.name"

Write-Host "Stockfish WASM and JS files downloaded successfully."
