# Beach Asset Generator - Stable Diffusion Setup

Local installation of Stable Diffusion for pixel art asset generation.

## Setup

### Files Included

- `bin/sd-cli.exe` - Stable Diffusion CLI (22 MB)
- `bin/sd-server.exe` - Stable Diffusion HTTP server (23 MB)
- `.env` - Configuration file
- `scripts/sd-setup.md` - Complete setup guide
- `scripts/sd-test.sh` - Validation script
- `scripts/models/` - Directory for model files

### Quick Start

1. **Download Model**: Follow instructions in `scripts/sd-setup.md`
   - Place quantized SD 1.5 model at: `scripts/models/sd15-base-q4_0.gguf`

2. **Validate**: Run `bash scripts/sd-test.sh`

3. **Configure**: Edit `.env` as needed

## Architecture

- **Binaries**: Pre-compiled stable-diffusion.cpp v0.16.0
- **Model Storage**: `scripts/models/` (git-ignored)
- **Configuration**: `.env` file with paths and settings

## Documentation

See `scripts/sd-setup.md` for:
- Step-by-step installation instructions
- Model download options
- Troubleshooting guide
- GPU/CUDA setup (optional)

## Status

Ready for use. Model download required before generating assets.
