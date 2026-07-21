# Integración comunitaria con EyedBot

El portal actúa como BFF. El navegador solo usa la sesión NextAuth y rutas same-origin; nunca recibe `COMMUNITY_API_KEY`, `COMMUNITY_SIGNING_SECRET` ni una identidad elegible por query.

## Configuración

- `EYEDBOT_API_URL`: origen HTTP privado de EyedBot.
- `EYEDBOT_WS_URL`: origen WebSocket público de EyedBot (por ejemplo `wss://bot.example.com`).
- `COMMUNITY_API_KEY`: Bearer compartido exclusivamente por los dos servidores.
- `COMMUNITY_SIGNING_SECRET`: secreto HMAC-SHA256 distinto de la API key.

Las cuatro variables deben coincidir con la configuración de EyedBot cuando corresponda. Sin configuración completa, la portada muestra el error de setup y no habilita una identidad ni datos alternativos.

## Firma

Cada request upstream usa identidad de la sesión y estas cabeceras:

`X-Community-User-Id`, `X-Community-Timestamp`, `X-Community-Nonce` y `X-Community-Signature`.

El canonical exacto es:

```text
METHOD
/path/sin/query
sha256_hex(cuerpo_utf8_exacto)
discord_user_id
timestamp
nonce
```

Las mutaciones pasan por Route Handlers con sesión, membresía y origen verificados. SSE se retransmite como `ReadableStream`; WebSocket usa un ticket de un solo uso emitido por el BFF.
