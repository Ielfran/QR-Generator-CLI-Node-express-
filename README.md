# QR Code API

A secure, performant REST API for generating customizable QR codes (PNG, SVG, JPEG, WebP) with logo embedding, error-correction, caching, and OpenAPI docs.

## Features
- Formats: `png`, `svg`, `jpeg`, `webp`
- Logo overlay
- Redis caching (1 h TTL)
- API-key auth, rate-limit (100 req/15 min)
- Compression, CORS, Winston logging
- Swagger UI at `/api-docs`

## Prerequisites
- Node ≥ 18
- Redis ≥ 6

## Setup
```bash
git clone <repo>
cd qr-code-api
npm install
cp .env.example .env
```

**.env**
```env
PORT=3000
REDIS_URL=redis://localhost:6379
API_KEY=your-very-secret-key
```

## Run Redis
```bash
docker run -d -p 6379:6379 --name qr-redis redis:alpine
# or: redis-server
```

Server: `http://localhost:3000`

**cURL examples**
```bash
# PNG
curl -H "x-api-key: $API_KEY" \
  "http://localhost:3000/api/v1/qrcode?data=https://example.com" -o qr.png

# JPEG + logo
curl -H "x-api-key: $API_KEY" \
  "http://localhost:3000/api/v1/qrcode?data=Hi&size=400&format=jpeg&logo=https://i.imgur.com/abc.png" -o qr.jpeg

# SVG
curl -H "x-api-key: $API_KEY" \
  "http://localhost:3000/api/v1/qrcode?data=SVG&format=svg" -o qr.svg
```

### `GET /api/v1/qrcode/metadata`
```bash
curl http://localhost:3000/api/v1/qrcode/metadata
```

**Response**
```json
{
  "success": true,
  "maxDataLength": {"L":2953,"M":2331,"Q":1663,"H":1273},
  "supportedFormats": ["png","svg","jpeg","webp"],
  "supportedErrorCorrection": ["L","M","Q","H"]
}
```
