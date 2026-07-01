#!/bin/sh

cat >/app/public/app.config.json <<EOF
{
  "googleMaps": {
    "apiKey": "${GOOGLE_MAPS_API_KEY}",
    "mapId": "${GOOGLE_MAPS_MAP_ID}"
  }
}
EOF

exec npm run dev -- --host 0.0.0.0