# Dashboard — Setup Guide

## Requisitos previos
- Node.js 18+
- npm

## 1. Instalar dependencias

```bash
cd dashboard
npm install
```

## 2. Configurar API keys

Copia `.env.example` a `.env` y rellena tus keys reales:

```bash
cp .env.example .env
```

| Variable | Dónde obtenerla |
|----------|----------------|
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys |
| `YOUTUBE_API_KEY` | console.cloud.google.com → APIs → YouTube Data API v3 → Credentials |
| `YOUTUBE_CHANNEL_ID` | Tu canal YouTube → URL → `UCxxxxxx` |
| `STRIPE_SECRET_KEY` | dashboard.stripe.com/apikeys → Secret key (live) |
| `INSTAGRAM_ACCESS_TOKEN` | developers.facebook.com → Instagram Graph API → Access Token |
| `INSTAGRAM_ACCOUNT_ID` | Tu cuenta Instagram Business ID |
| `META_APP_TOKEN` | `APP_ID\|APP_SECRET` (opcional, para alerta de expiración) |

## 3. Arrancar el servidor

```bash
npm start
# o en modo desarrollo (auto-restart):
npm run dev
```

El dashboard estará disponible en: **http://localhost:3001**

## 4. Acceso desde iPhone (misma WiFi)

1. Ajustes → WiFi → pulsa tu red → IP del Mac (ej: `192.168.1.45`)
2. Safari iPhone → `http://192.168.1.45:3001`
3. Compartir → **"Añadir a pantalla de inicio"** → nombre: `Dashboard`

## 5. Acceso desde cualquier sitio (Cloudflare Tunnel)

Para acceder desde el iPhone sin estar en casa (datos móviles, otra red):

```bash
# Instalar cloudflared (macOS)
brew install cloudflare/cloudflare/cloudflared

# Crear túnel temporal (nueva URL cada arranque)
cloudflared tunnel --url http://localhost:3001
```

Te dará una URL pública tipo `https://xxx.trycloudflare.com`.

**Notar:** El `SERVER` en el dashboard se auto-detecta — funciona tanto en localhost como a través del túnel sin cambiar nada.

## 6. Actualizar tareas y datos semanales

Edita `state.json` directamente para:
- Cambiar tareas semanales
- Actualizar foco semanal (`weekFocus`)
- Cambiar el principio de mentalidad (`mindset.weekPrinciple`)
- Registrar progreso (los valores reales se actualizan automáticamente vía APIs)

## 7. Renovar token de Instagram

El token de Instagram expira a los 60 días. El dashboard muestra una alerta cuando quedan menos de 10 días.

Para renovar:
```
GET https://graph.facebook.com/v18.0/oauth/access_token
  ?grant_type=fb_exchange_token
  &client_id=APP_ID
  &client_secret=APP_SECRET
  &fb_exchange_token=TOKEN_ACTUAL
```

Actualiza `INSTAGRAM_ACCESS_TOKEN` en `.env` con el nuevo token.
