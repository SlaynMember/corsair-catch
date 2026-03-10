param([switch]$Verbose)

Write-Host "🧪 Testing Stable Diffusion setup..." -ForegroundColor Cyan
Write-Host ""

# Load .env
$envFile = ".\.env"
if (-not (Test-Path $envFile)) {
    Write-Host "✗ Error: .env not found at $envFile" -ForegroundColor Red
    Write-Host "  Copy .env.example to .env and fill in values" -ForegroundColor Yellow
    exit 1
}

# Parse .env (simple line-by-line)
$envVars = @{}
Get-Content $envFile | Where-Object { $_ -match '^[^#]' -and $_ -match '=' } | ForEach-Object {
    if ($_ -match '^\s*(.+?)\s*=\s*(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        $envVars[$key] = $value
    }
}

# Validate required keys
$requiredKeys = @('SD_CLI_PATH', 'SD_MODEL_PATH', 'SD_MODEL_TYPE')
foreach ($key in $requiredKeys) {
    if (-not $envVars.ContainsKey($key) -or [string]::IsNullOrEmpty($envVars[$key])) {
        Write-Host "✗ Missing required .env key: $key" -ForegroundColor Red
        exit 1
    }
}

$cliPath = $envVars['SD_CLI_PATH']
$modelPath = $envVars['SD_MODEL_PATH']
$modelType = $envVars['SD_MODEL_TYPE']

# Test 1: Check CLI binary
Write-Host "Test 1: Checking CLI binary..." -ForegroundColor Cyan
if (Test-Path $cliPath) {
    $fileSize = (Get-Item $cliPath).Length / 1MB
    Write-Host "✓ CLI binary found at: $cliPath ($([Math]::Round($fileSize, 1)) MB)" -ForegroundColor Green
} else {
    Write-Host "✗ CLI binary not found at: $cliPath" -ForegroundColor Red
    exit 1
}

# Test 2: Check --help works
Write-Host "Test 2: Verifying CLI works..." -ForegroundColor Cyan
try {
    $output = & $cliPath --help 2>&1 | Out-String
    if ($output -match 'usage|help|options|stable-diffusion') {
        Write-Host "✓ CLI responds to --help" -ForegroundColor Green
    } else {
        Write-Host "✗ CLI --help output unexpected" -ForegroundColor Red
        if ($Verbose) {
            Write-Host "Output: $output" -ForegroundColor Gray
        }
        exit 1
    }
} catch {
    Write-Host "✗ Failed to run CLI: $_" -ForegroundColor Red
    exit 1
}

# Test 3: Check model path directory
Write-Host "Test 3: Checking model path..." -ForegroundColor Cyan
$modelDir = Split-Path $modelPath -Parent
if (Test-Path $modelDir) {
    Write-Host "✓ Model directory exists: $modelDir" -ForegroundColor Green

    # Check if actual model file exists
    if (Test-Path $modelPath) {
        $modelSize = (Get-Item $modelPath).Length / 1GB
        Write-Host "✓ Model file found ($([Math]::Round($modelSize, 2)) GB)" -ForegroundColor Green
    } else {
        Write-Host "⚠ Model file not found at: $modelPath" -ForegroundColor Yellow
        Write-Host "  Download a quantized SD model to this location" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠ Model directory missing: $modelDir" -ForegroundColor Yellow
    Write-Host "  Will be created automatically when model is downloaded" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ All tests passed! Setup is ready." -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Configuration Summary:" -ForegroundColor Cyan
Write-Host "  CLI Path:       $cliPath"
Write-Host "  Model Type:     $modelType"
Write-Host "  Model Path:     $modelPath"
Write-Host ""
Write-Host "Next step: Download a quantized Stable Diffusion model" -ForegroundColor Cyan
Write-Host "  See scripts/sd-setup.md for download instructions" -ForegroundColor Cyan
Write-Host ""
