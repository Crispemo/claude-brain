#!/bin/bash
# Setup túnel permanente de Cloudflare con subdominio fijo
# Ejecutar UNA VEZ después de cloudflared login

TUNNEL_NAME="cris-dashboard"
SUBDOMAIN="dash"
DOMAIN="simulia.es"
LOCAL_PORT=3001

echo "🚀 Configurando túnel permanente $SUBDOMAIN.$DOMAIN..."

# 1. Crear el túnel (si no existe)
cloudflared tunnel create $TUNNEL_NAME 2>/dev/null || echo "Túnel ya existe"

# 2. Obtener UUID del túnel
TUNNEL_UUID=$(cloudflared tunnel list --output json 2>/dev/null | python3 -c "
import json,sys
data=json.load(sys.stdin)
tunnels=[t for t in data if t['name']=='$TUNNEL_NAME']
print(tunnels[0]['id'] if tunnels else '')
")
echo "UUID del túnel: $TUNNEL_UUID"

# 3. Crear config.yml
mkdir -p ~/.cloudflared
cat > ~/.cloudflared/config.yml << CONF
tunnel: $TUNNEL_UUID
credentials-file: $HOME/.cloudflared/$TUNNEL_UUID.json

ingress:
  - hostname: $SUBDOMAIN.$DOMAIN
    service: http://localhost:$LOCAL_PORT
  - service: http_status:404
CONF

echo "✅ Config creado en ~/.cloudflared/config.yml"

# 4. Crear ruta DNS
echo "Creando ruta DNS $SUBDOMAIN.$DOMAIN..."
cloudflared tunnel route dns $TUNNEL_NAME $SUBDOMAIN.$DOMAIN

echo ""
echo "✅ LISTO. Tu URL permanente es: https://$SUBDOMAIN.$DOMAIN"
echo ""
echo "Para iniciar el túnel: cloudflared tunnel run $TUNNEL_NAME"
echo "Para iniciar automáticamente al arrancar el Mac:"
echo "  cloudflared service install"
