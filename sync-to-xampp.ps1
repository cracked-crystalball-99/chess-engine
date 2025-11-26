#!/usr/bin/env powershell
<#
.SYNOPSIS
    Sync chess engine to XAMPP localhost for testing
.DESCRIPTION
    Synchronizes the chess engine files from this repository to XAMPP htdocs
    for easy localhost testing and development
.PARAMETER XamppPath
    Path to XAMPP htdocs chess engine directory
.PARAMETER OpenBrowser
    Whether to open browser after sync (default: true)
#>

param(
    [string]$XamppPath = "C:\xampp\htdocs\BJ-FM-js-chess-engine-fun",
    [bool]$OpenBrowser = $true
)

$SourcePath = Get-Location
Write-Host "🔄 Syncing Chess Engine to XAMPP Localhost" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan

# Check if XAMPP directory exists
if (-not (Test-Path $XamppPath)) {
    Write-Host "📁 Creating XAMPP directory: $XamppPath" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $XamppPath -Force | Out-Null
}

Write-Host "📂 Source: $SourcePath" -ForegroundColor Green
Write-Host "🎯 Target: $XamppPath" -ForegroundColor Green
Write-Host ""

# Core files to sync (always copy these)
$CoreFiles = @(
    "index.html",
    "main.js", 
    "README.md",
    "stockfish.js",
    "stockfish.wasm"
)

# Additional files (copy if they exist)
$OptionalFiles = @(
    ".placeholder",
    "MyStockfishWorkspace.code-workspace"
)

Write-Host "📋 Syncing core files..." -ForegroundColor Yellow
foreach ($file in $CoreFiles) {
    if (Test-Path $file) {
        Copy-Item $file $XamppPath -Force
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file (MISSING - REQUIRED!)" -ForegroundColor Red
    }
}

Write-Host "📋 Syncing optional files..." -ForegroundColor Yellow
foreach ($file in $OptionalFiles) {
    if (Test-Path $file) {
        Copy-Item $file $XamppPath -Force
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ⚪ $file (not found - optional)" -ForegroundColor Gray
    }
}

# Sync img directory
if (Test-Path "img" -PathType Container) {
    Write-Host "📁 Syncing img directory..." -ForegroundColor Yellow
    if (Test-Path "$XamppPath\img") {
        Remove-Item "$XamppPath\img" -Recurse -Force
    }
    Copy-Item "img" $XamppPath -Recurse -Force
    Write-Host "  ✅ img directory" -ForegroundColor Green
} else {
    Write-Host "  ⚪ img directory (not found)" -ForegroundColor Gray
}

# Clean up old files that shouldn't be in localhost
$FilesToRemove = @(
    "download_hls_ax.py",
    "download_stockfish.ps1", 
    "hls_ax_6mo_close.csv",
    "GME.csv",
    "fetch-gcf.js",
    "gcf-gemini-iterations.py",
    ".git"
)

Write-Host "🧹 Cleaning up old files..." -ForegroundColor Yellow
foreach ($file in $FilesToRemove) {
    $targetFile = Join-Path $XamppPath $file
    if (Test-Path $targetFile) {
        if (Test-Path $targetFile -PathType Container) {
            Remove-Item $targetFile -Recurse -Force
        } else {
            Remove-Item $targetFile -Force
        }
        Write-Host "  🗑️  Removed $file" -ForegroundColor Magenta
    }
}

# Create a timestamp file for tracking sync
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$syncInfo = @"
Last synced: $timestamp
Source: $SourcePath
Synced by: sync-to-xampp.ps1
"@
$syncInfo | Out-File "$XamppPath\last-sync.txt" -Encoding UTF8

Write-Host ""
Write-Host "✅ Sync completed successfully!" -ForegroundColor Green
Write-Host "🕐 Timestamp: $timestamp" -ForegroundColor Blue
Write-Host "📄 Sync info saved to: last-sync.txt" -ForegroundColor Blue

# Show localhost URL
$localhostUrl = "http://localhost/BJ-FM-js-chess-engine-fun"
Write-Host ""
Write-Host "🌐 Localhost URL: $localhostUrl" -ForegroundColor Cyan
Write-Host "🚀 Make sure XAMPP is running!" -ForegroundColor Yellow

# Open browser if requested
if ($OpenBrowser) {
    Write-Host "🌍 Opening browser..." -ForegroundColor Green
    Start-Process $localhostUrl
}

Write-Host ""
Write-Host "💡 Tips:" -ForegroundColor Blue
Write-Host "   • Run this script after making changes to sync instantly" -ForegroundColor White
Write-Host "   • Use -OpenBrowser `$false to skip opening browser" -ForegroundColor White  
Write-Host "   • Files are cleaned and optimized for localhost testing" -ForegroundColor White