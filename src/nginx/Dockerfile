# Nginx gateway with ModSecurity v3 + OWASP CRS baked in.
FROM owasp/modsecurity-crs:nginx-alpine

# Build as root (apk + cert generation need it); the runtime drops back to the
# image's unprivileged 'nginx' user (see USER nginx below) — rootless-friendly.
USER root

# Self-signed certificate for local TLS termination. The key is owned by and
# readable to 'nginx' so the non-root runtime can load it.
RUN apk add --no-cache openssl && \
    mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/nginx-selfsigned.key \
        -out /etc/nginx/ssl/nginx-selfsigned.crt \
        -subj "/C=FR/ST=Paris/L=Paris/O=ChessGuard/CN=localhost" && \
    chown -R nginx:nginx /etc/nginx/ssl && \
    chmod 640 /etc/nginx/ssl/nginx-selfsigned.key

# Our server block replaces the image's single-upstream default template.
COPY nginx.conf /etc/nginx/templates/conf.d/default.conf.template

# Route-scoped CRS exclusions (REQUEST-900 slot loads before the CRS rules).
COPY modsec/crs-exclusions.conf /etc/modsecurity.d/owasp-crs/rules/REQUEST-900-EXCLUSION-RULES-BEFORE-CRS.conf

# Audit log target (mounted as a volume at runtime).
RUN mkdir -p /var/log/modsecurity && chown nginx:nginx /var/log/modsecurity

COPY html /usr/share/nginx/html

# Run fully non-root on an unprivileged port; publish host 443 -> 8443.
USER nginx
EXPOSE 8443
