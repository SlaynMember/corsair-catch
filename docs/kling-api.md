# Kling AI Image Generation API Reference

> For use by any agent needing to generate images via Kling AI.
> Keys stored in `~/.env` and project `.env` files (gitignored).

## Authentication

Kling uses JWT (RFC 7519) authentication — NOT raw API keys in headers.

**Environment Variables:**
- `KLING_ACCESS_KEY` — JWT `iss` claim (the "API Key ID")
- `KLING_SECRET_KEY` — HMAC-SHA256 signing secret

**JWT Token Generation:**
```python
import jwt, time

def make_kling_token(access_key: str, secret_key: str) -> str:
    now = int(time.time())
    payload = {
        "iss": access_key,
        "exp": now + 1800,  # 30 min expiry
        "nbf": now - 5,
        "iat": now,
    }
    return jwt.encode(payload, secret_key, algorithm="HS256",
                      headers={"typ": "JWT", "alg": "HS256"})
```

```javascript
// Node.js equivalent using jsonwebtoken
const jwt = require('jsonwebtoken');
function makeKlingToken(accessKey, secretKey) {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    { iss: accessKey, exp: now + 1800, nbf: now - 5, iat: now },
    secretKey,
    { algorithm: 'HS256', header: { typ: 'JWT', alg: 'HS256' } }
  );
}
```

**Request Header:** `Authorization: Bearer <JWT_TOKEN>` (space after "Bearer")

## API Domain

All requests go to: `https://api-singapore.klingai.com`

## Endpoint Routing

| Model | POST Endpoint | Use Case |
|-------|---------------|----------|
| `kling-v3-omni` | `/v1/images/omni-image` | Flagship: 4K, custom ratios, text-to-image + image-to-image |
| `kling-image-o1` | `/v1/images/omni-image` | Smart aspect ratios, 1K-2K |
| `kling-v3` | `/v1/images/generations` | Custom ratios, 1K-2K |
| `kling-v2-1` | `/v1/images/generations` | Most versatile standard: face/subject/restyle/multi-image |
| `kling-v2` | `/v1/images/generations` | Standard text-to-image + multi-image |
| `kling-v2-new` | `/v1/images/generations` | Image-to-image restyle only (no text-to-image) |
| `kling-v1-5` | `/v1/images/generations` | Subject/face image-to-image at 1K |
| Multi-image | `/v1/images/multi-image2image` | Combine subject + scene + style (v2/v2-1 only) |

## Model Selection Quick Guide

- **Need 4K?** → `kling-v3-omni`
- **Pixel art game sprites?** → `kling-v2-1` at 1K (most control over style)
- **Face/subject swaps?** → `kling-v1-5` or `kling-v2-1`
- **Custom non-standard sizing?** → `kling-v3-omni`, `kling-image-o1`, or `kling-v3`
- **Simple text-to-image?** → `kling-v2-1` or `kling-v3`
- **Restyle existing image?** → `kling-v2-new`, `kling-v2`, or `kling-v2-1`

## Standard Image Generation (`/v1/images/generations`)

### POST Request
```json
{
  "model": "kling-v2-1",
  "prompt": "A pixel art pirate ship on sunset ocean, 16-bit style",
  "negative_prompt": "blurry, low quality",
  "n": 1,
  "aspect_ratio": "16:9",
  "callback_url": ""
}
```

**Fixed aspect ratios** (v1, v1-5, v2, v2-1): `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`

### Image-to-Image (add `image` param)
```json
{
  "model": "kling-v2-1",
  "prompt": "Transform into pixel art style",
  "image": "https://example.com/source.png",
  "n": 1,
  "aspect_ratio": "16:9"
}
```

**⚠️ When `image` is set, `negative_prompt` is NOT supported — omit it.**

### v1-5 Subject/Face Reference
```json
{
  "model": "kling-v1-5",
  "prompt": "Portrait in pirate costume",
  "image": "https://example.com/face.png",
  "image_reference": "face",
  "human_fidelity": 0.8,
  "n": 1
}
```
- `image_reference`: `"subject"` or `"face"` (required for v1-5)
- `human_fidelity`: 0-1 (subject mode only)
- Face mode: image must contain exactly 1 face

## Omni-Image (`/v1/images/omni-image`)

### Text-to-Image
```json
{
  "model": "kling-v3-omni",
  "prompt": "A detailed pirate cove at sunset",
  "result_type": "single",
  "n": 1,
  "width": 1376,
  "height": 768
}
```

### Image-to-Image (template prompts)
```json
{
  "model": "kling-v3-omni",
  "prompt": "Transform <<<image_1>>> into pixel art style with warm sunset colors",
  "result_type": "single",
  "n": 1,
  "image_list": ["https://example.com/source.png"],
  "width": 1376,
  "height": 768
}
```

- **Single mode:** use `n` (1-9), omit `series_amount`
- **Series mode:** use `series_amount` (2-9), omit `n`
- Reference images in prompt: `<<<image_1>>>`, `<<<image_2>>>`, `<<<object_1>>>`
- Custom dimensions supported (v3-omni supports up to 4K)

## Multi-Image to Image (`/v1/images/multi-image2image`)

```json
{
  "model": "kling-v2-1",
  "prompt": "Pirate character on a beach at sunset",
  "subject_image_list": [
    {"subject_image": "https://example.com/pirate.png"}
  ],
  "scene_image": "https://example.com/beach-bg.png",
  "style_image": "https://example.com/pixel-art-ref.png",
  "n": 1,
  "aspect_ratio": "16:9"
}
```

- **Models:** `kling-v2` or `kling-v2-1` only
- `subject_image_list`: 1-4 images (required, array of objects)
- `scene_image`: optional (single URL)
- `style_image`: optional (single URL)
- **No cropping** — pre-crop subjects tightly before upload

## Querying Results (Polling)

All POST requests return a `task_id`. Poll the matching GET endpoint:

| Creation Endpoint | Query Endpoint |
|-------------------|----------------|
| `POST /v1/images/generations` | `GET /v1/images/generations/{task_id}` |
| `POST /v1/images/omni-image` | `GET /v1/images/omni-image/{task_id}` |
| `POST /v1/images/multi-image2image` | `GET /v1/images/multi-image2image/{task_id}` |

### Poll Response
```json
{
  "code": 0,
  "data": {
    "task_id": "xxx",
    "task_status": "succeed",
    "task_result": {
      "images": [
        { "index": 0, "url": "https://..." }
      ]
    }
  }
}
```

**Status values:**
- `submitted` / `processing` → wait 2-5s, poll again
- `succeed` → extract `data.task_result.images[].url`
- `failed` → read `data.task_status_msg` for error

**⚠️ Image URLs expire after 30 days — download immediately on success.**

## Validation Rules (All Endpoints)

- **Base64 images:** Strip the `data:image/png;base64,` prefix — send raw encoded string only
- **Image files:** max 10MB, min 300px dimensions, ratio between 1:2.5 and 2.5:1
- **Formats:** `.jpg`, `.jpeg`, `.png`
- **Combined limit:** `image_list` + `element_list` items ≤ 10 total

## Recommended Polling Helper

```javascript
async function pollKlingTask(endpoint, taskId, token, maxAttempts = 30) {
  const base = 'https://api-singapore.klingai.com';
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 3000)); // 3s between polls
    const res = await fetch(`${base}${endpoint}/${taskId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await res.json();
    const status = json.data?.task_status;
    if (status === 'succeed') return json.data.task_result.images;
    if (status === 'failed') throw new Error(json.data.task_status_msg);
  }
  throw new Error('Polling timeout');
}
```

## For Corsair Catch

Game assets are 1376×768 (backgrounds) or small sprites. Recommended setup:
- **Backgrounds:** `kling-v3-omni` at 1376×768 custom dimensions
- **Sprite sheets:** `kling-v2-1` at 1:1 ratio, then slice
- **Style reference:** Pass existing game art as `style_image` or `<<<image_1>>>` for consistency
