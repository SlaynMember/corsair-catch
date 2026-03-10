# Stable Diffusion Setup & Configuration

**Date**: 2026-03-10
**Status**: Installation Complete (Model Pending)
**Platform**: Windows 11 with NVIDIA 3060 Ti
**Build Method**: stable-diffusion.cpp v0.16.0 from source

## Step 1: Installation Method ✅

Chose **stable-diffusion.cpp** for the following reasons:

1. **Zero dependencies**: Pure C++ with minimal external requirements
2. **CUDA-ready**: Supports GPU acceleration via NVIDIA CUDA
3. **Quantization support**: Handles `.gguf` quantized models (2-4GB range)
4. **Fast inference**: Optimized for consumer GPUs
5. **No subscriptions**: Completely local, no API costs
6. **Active maintenance**: Regular updates and community support

### Build Details

- **Repository**: https://github.com/leejet/stable-diffusion.cpp
- **Version**: v0.16.0 (commit d6dd6d7)
- **Build date**: 2026-03-10
- **Build location**: `~/sd-cpp-build/stable-diffusion.cpp`
- **Binary location**: `./bin/sd-cli.exe` and `./bin/sd-server.exe`

### Build Command Used

```bash
mkdir build && cd build
cmake .. -DCMAKE_BUILD_TYPE=Release
cmake --build . --config Release
```

### Binaries Generated

- `sd-cli.exe` (22 MB) - Command-line interface
- `sd-server.exe` (23 MB) - HTTP server interface

## Step 2: Model Download & Setup

### Current Status

Model download requires authenticated access to Hugging Face. This is a **known limitation** of direct downloads from HF private URLs.

### Recommended Models for Pixel Art Generation

For generating 48px beach assets, recommend **Stable Diffusion 1.5 with Q4_0 quantization**:

| Model | Size | VRAM | Speed | Best For |
|-------|------|------|-------|----------|
| SD 1.5 Q4_0 | 2.4 GB | 4 GB | Fast | Pixel art, low resources |
| SD 1.5 Q5_0 | 2.9 GB | 6 GB | Medium | Better quality |
| SD 1.5 Q8_0 | 4.2 GB | 8 GB+ | Slower | Highest quality |

### Download Options

**Option A: Hugging Face (Recommended but requires auth)**
```bash
# After authenticating to HF:
huggingface-cli download leejet/stable-diffusion-1.5-q4_0-gguf \
  --repo-type model \
  --local-dir ./scripts/models
```

**Option B: Manual GGUF Conversion**
```bash
# If you have the original safetensors model:
python convert_to_gguf.py path/to/sd-v1-5.safetensors \
  --quantize q4_0 \
  --output ./scripts/models/sd15-base-q4_0.gguf
```

**Option C: Direct GGUF Download (when internet permits)**
Download from: https://huggingface.co/leejet/stable-diffusion-1.5-q4_0-gguf

**Option D: Test with Tiny Model**
For development without downloading large files:
```bash
# Create a minimal test model (demonstration purposes only)
python scripts/create_test_model.py
```

### Model File Organization

Expected structure after download:

```
models/
├── sd15-base-q4_0.gguf       ← Main model file (2.4-4.2 GB)
├── (optional) vae.gguf       ← Custom VAE for better decoding
└── (optional) control-net.gguf ← For conditional generation
```

## Step 3: Testing & Validation

### Quick Setup Test

Run the PowerShell test script to validate your installation:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/sd-test.ps1
```

This script checks:
- ✓ `.env` configuration file exists and is readable
- ✓ CLI binary (`sd-cli.exe`) is present and executable
- ✓ Model directory structure (`./scripts/models/`) is ready
- ✓ CLI responds to help command

Expected output:
```
🧪 Testing Stable Diffusion setup...

Test 1: Checking CLI binary...
✓ CLI binary found at: ./bin/sd-cli.exe (22.0 MB)

Test 2: Verifying CLI works...
✓ CLI responds to --help

Test 3: Checking model path...
✓ Model directory exists: ./scripts/models

✅ All tests passed! Setup is ready.
```

### Verbose Testing

For detailed diagnostic output:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/sd-test.ps1 -Verbose
```

## Step 4: Configuration (.env)

### Setup Configuration File

1. **Copy template** from `.env.example`:
   ```powershell
   Copy-Item .env.example .env
   ```

2. **Edit `.env`** with your settings:
   ```env
   # Stable Diffusion Setup
   SD_CLI_PATH=./bin/sd-cli.exe
   SD_SERVER_PATH=./bin/sd-server.exe
   SD_MODEL_PATH=./scripts/models/sd15-base-q4_0.gguf
   SD_MODEL_TYPE=gguf
   SD_STEPS=25
   SD_CFG_SCALE=7.5
   SD_SAMPLER=euler
   SD_NUM_THREADS=4
   SD_DEFAULT_SEED=12345
   ```

3. **Validate** with test script (Step 3):
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/sd-test.ps1
   ```

**Note**: `.env` is git-ignored (contains local paths). The template `.env.example` is committed for reference.

## Step 5: GPU Setup (Optional but Recommended)

### CUDA Setup for 3060 Ti

**Current Status**: CUDA toolkit not found in PATH

**To enable GPU acceleration:**

1. Download CUDA Toolkit 12.4+ from: https://developer.nvidia.com/cuda-downloads
2. Install with default options
3. Rebuild with CUDA support:

```bash
cd ~/sd-cpp-build/stable-diffusion.cpp
rm -rf build && mkdir build && cd build
cmake .. -DSD_CUDA=ON -DCMAKE_BUILD_TYPE=Release
cmake --build . --config Release
```

4. Copy new binaries:
```bash
cp build/bin/Release/sd-cli.exe /path/to/beach-asset-gen/bin/
```

**Expected speedup with CUDA**:
- CPU-only: 60-180 seconds per 512x512 image (20 steps)
- CUDA 3060 Ti: 8-15 seconds per 512x512 image (20 steps)
- ~10-15x faster with proper GPU acceleration

## Setup Scripts

Utility scripts provided:

- `sd-test.ps1` - Quick setup validation (PowerShell, Windows-native)
- `sd-setup.md` - This file (comprehensive setup guide)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `sd-cli.exe` not found | Verify `./bin/sd-cli.exe` exists and is executable |
| Model file not found | Download model to `./scripts/models/sd15-base-q4_0.gguf` |
| Out of memory | Use smaller model (Q4_0) or reduce image size |
| Slow generation | Enable CUDA (see GPU Setup section) |
| SSL certificate errors | Update Windows certificates or use proxy |

## References

- stable-diffusion.cpp: https://github.com/leejet/stable-diffusion.cpp
- GGUF quantized models: https://huggingface.co/leejet/stable-diffusion-1.5-q4_0-gguf
- GGML project: https://github.com/ggml-org/ggml

## Next Steps

1. [ ] Obtain & download quantized model file
2. [ ] Run test generation (Step 3)
3. [ ] Verify output quality for pixel art use case
4. [ ] (Optional) Install CUDA toolkit and rebuild for GPU
5. [ ] Create integration script for game asset pipeline
