#!/usr/bin/env powershell
<#
.SYNOPSIS
    Quick development sync - updates only HTML/JS files to XAMPP
.DESCRIPTION
    Fast sync for development - only copies the files you're likely editing
#>

param(
    [string]$XamppPath = "C:\xampp\htdocs\BJ-FM-js-chess-engine-fun"
)

if (-not (Test-Path $XamppPath)) {
    Write-Host "❌ XAMPP directory not found: $XamppPath" -ForegroundColor Red
    Write-Host "💡 Run sync-to-xampp.ps1 first for full setup" -ForegroundColor Yellow
    exit 1
}

$DevFiles = @("index.html", "main.js")
$timestamp = Get-Date -Format "HH:mm:ss"

Write-Host "⚡ Quick Sync [$timestamp]" -ForegroundColor Cyan

foreach ($file in $DevFiles) {
    if (Test-Path $file) {
        Copy-Item $file $XamppPath -Force
        Write-Host "  ✅ $file" -ForegroundColor Green
    }
}

Write-Host "🔄 Refresh browser to see changes!" -ForegroundColor Blue