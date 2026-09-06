#!/bin/sh
set -e

# Write runtime configuration from container environment to Nginx web root
cat <<EOF > /usr/share/nginx/html/env-config.js
window.__RUNTIME_CONFIG__ = {
  VITE_API_BASE_URL: "${VITE_API_BASE_URL:-}"
};
EOF

# Substitute environment variables in nginx.conf if template exists
if [ -f /etc/nginx/templates/default.conf.template ]; then
  BACKEND_PROXY="${BACKEND_URL:-}"
  if [ -z "$BACKEND_PROXY" ] && [ -n "$VITE_API_BASE_URL" ]; then
    BACKEND_PROXY="$(echo "$VITE_API_BASE_URL" | sed 's/\/api\/v1\/?*$//')"
  fi
  export BACKEND_PROXY="${BACKEND_PROXY:-http://localhost:8000}"
  envsubst '${BACKEND_PROXY}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf
fi

exec "$@"
