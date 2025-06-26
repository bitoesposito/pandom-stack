# Load Balancing & High Availability

## Panoramica

Il sistema Pandom Stack implementa load balancing e High Availability (HA) utilizzando Nginx come reverse proxy con multiple istanze di backend e frontend.

## Architettura

```
                    ┌─────────────┐
                    │   Nginx     │
                    │  (Port 80)  │
                    └─────┬───────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
    ┌───▼───┐         ┌───▼───┐         ┌───▼───┐
    │Backend│         │Backend│         │Backend│
    │   1   │         │   2   │         │   3   │
    └───────┘         └───────┘         └───────┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
    ┌─────────────────────┼─────────────────────┐
    │                     │                     │
┌───▼───┐             ┌───▼───┐             ┌───▼───┐
│Frontend│             │Frontend│             │Frontend│
│   1    │             │   2    │             │   3    │
└───────┘             └───────┘             └───────┘
```

## Configurazione Nginx

### Caratteristiche Principali

- **Load Balancing**: Least connections algorithm
- **Health Checks**: Automatic monitoring delle istanze
- **Rate Limiting**: Protezione contro DDoS
- **SSL/TLS**: Supporto HTTPS (configurabile)
- **Caching**: Ottimizzazione performance
- **Security Headers**: Protezione avanzata

### Algoritmi di Load Balancing

```nginx
# Least connections (default)
upstream backend_servers {
    least_conn;
    server backend-1:3000;
    server backend-2:3000;
    server backend-3:3000;
}

# Round robin (alternativa)
upstream backend_servers {
    server backend-1:3000;
    server backend-2:3000;
    server backend-3:3000;
}

# Weighted round robin
upstream backend_servers {
    server backend-1:3000 weight=3;
    server backend-2:3000 weight=2;
    server backend-3:3000 weight=1;
}
```

### Health Checks

```nginx
upstream backend_servers {
    least_conn;
    
    # Health check configuration
    health_check interval=10s fails=3 passes=2;
    
    server backend-1:3000 max_fails=3 fail_timeout=30s;
    server backend-2:3000 max_fails=3 fail_timeout=30s;
    server backend-3:3000 max_fails=3 fail_timeout=30s;
}
```

### Rate Limiting

```nginx
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/s;

# Apply to API routes
location /api/ {
    limit_req zone=api burst=20 nodelay;
    proxy_pass http://backend_servers/;
}

# Stricter limits for auth
location /api/auth/ {
    limit_req zone=auth burst=10 nodelay;
    proxy_pass http://backend_servers/auth/;
}
```

## Deployment

### Production Mode (HA)

```bash
# Avvia con load balancing e HA
docker-compose up -d

# Verifica status
docker-compose ps

# Controlla logs Nginx
docker-compose logs -f nginx
```

### Development Mode

Per development, puoi modificare il `docker-compose.yml` per utilizzare una sola istanza:

```bash
# Commenta le istanze multiple nel docker-compose.yml
# e usa solo backend-1 e frontend-1

# Avvia con configurazione semplificata
docker-compose up -d backend-1 frontend-1 nginx postgres minio
```

## Monitoring

### Health Check Endpoints

```bash
# Nginx health check
curl http://localhost/health

# Backend health checks
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3002/health

# Frontend health checks
curl http://localhost:4200
curl http://localhost:4201
```

### Logs

```bash
# Nginx logs
docker-compose logs -f nginx

# Backend logs
docker-compose logs -f backend-1
docker-compose logs -f backend-2
docker-compose logs -f backend-3

# Frontend logs
docker-compose logs -f frontend-1
docker-compose logs -f frontend-2
```

### Metrics

```bash
# Verifica connessioni attive
docker exec nginx nginx -t

# Statistiche Nginx (se abilitato)
curl http://localhost/nginx_status
```

## Failover e Recovery

### Automatic Failover

1. **Health Check Failure**: Nginx rileva istanza non responsive
2. **Automatic Removal**: Istanza rimossa dal pool di load balancing
3. **Traffic Redistribution**: Traffico distribuito tra istanze sane
4. **Recovery**: Istanza riaggiunta quando torna online

### Manual Recovery

```bash
# Restart istanza specifica
docker-compose restart backend-1

# Restart tutti i backend
docker-compose restart backend-1 backend-2 backend-3

# Verifica recovery
docker-compose logs backend-1
```

## Performance Optimization

### Caching

```nginx
# Cache static assets
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Compression

```nginx
# Gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_comp_level 6;
gzip_types
    text/plain
    text/css
    text/javascript
    application/json
    application/javascript;
```

### Connection Pooling

```nginx
# Keep connections alive
upstream backend_servers {
    least_conn;
    keepalive 32;
    
    server backend-1:3000;
    server backend-2:3000;
    server backend-3:3000;
}
```

## Security

### Security Headers

```nginx
# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' ws: wss:;" always;
```

### SSL/TLS (Production)

```nginx
# HTTPS configuration
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;
}
```