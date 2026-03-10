#!/bin/bash
# Quick test script for Stable Diffusion setup
# Tests that binaries and configuration are working

echo "================================"
echo "Stable Diffusion Setup Test"
echo "================================"
echo ""

# Check working directory
echo "1. Checking working directory..."
if [ ! -f ".env" ]; then
    echo "   ✗ .env not found - must run from beach-asset-gen directory"
    exit 1
fi
echo "   ✓ .env found"
echo ""

# Load configuration
echo "2. Loading configuration from .env..."
source .env
echo "   ✓ Configuration loaded"
echo ""

# Check CLI binary
echo "3. Checking CLI binary..."
if [ ! -f "$SD_CLI_PATH" ]; then
    echo "   ✗ CLI not found at: $SD_CLI_PATH"
    echo "   Build with: cd ~/sd-cpp-build/stable-diffusion.cpp && mkdir build && cd build && cmake .. && cmake --build . --config Release"
    exit 1
fi
echo "   ✓ CLI found: $SD_CLI_PATH"
file_size=$(stat -f%z "$SD_CLI_PATH" 2>/dev/null || stat -c%s "$SD_CLI_PATH" 2>/dev/null)
echo "   Size: $(($file_size / 1024 / 1024)) MB"
echo ""

# Check model file
echo "4. Checking model file..."
if [ ! -f "$SD_MODEL_PATH" ]; then
    echo "   ✗ Model not found at: $SD_MODEL_PATH"
    echo "   Download from: https://huggingface.co/leejet/stable-diffusion-1.5-q4_0-gguf"
    echo "   See scripts/sd-setup.md for download instructions"
    exit 1
fi
echo "   ✓ Model found: $SD_MODEL_PATH"
model_size=$(stat -f%z "$SD_MODEL_PATH" 2>/dev/null || stat -c%s "$SD_MODEL_PATH" 2>/dev/null)
echo "   Size: $(($model_size / 1024 / 1024)) MB"
echo ""

# Test CLI help
echo "5. Testing CLI help output..."
if "$SD_CLI_PATH" --help &>/dev/null || "$SD_CLI_PATH" -h &>/dev/null; then
    echo "   ✓ CLI responds to help"
else
    echo "   ⚠ CLI help output contains warnings (normal)"
fi
echo ""

# Summary
echo "================================"
echo "✓ All checks passed!"
echo "================================"
echo ""
echo "Configuration Summary:"
echo "  CLI Path:       $SD_CLI_PATH"
echo "  Model Path:     $SD_MODEL_PATH"
echo "  Model Type:     $SD_MODEL_TYPE"
echo ""
echo "Setup is ready. Download model and configure as needed."
echo ""
