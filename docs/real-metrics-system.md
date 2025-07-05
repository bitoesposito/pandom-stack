# 📊 Sistema di Metriche Reali

## Panoramica

Il sistema di metriche reali sostituisce le metriche simulate con dati reali basati su:
- **Richieste HTTP** catturate tramite interceptor
- **Log di audit** per attività utente
- **Metriche di performance** in tempo reale
- **Alert automatici** basati su soglie configurabili

## 🏗️ Architettura

### Componenti Principali

1. **MetricsService** (`backend/src/common/services/metrics.service.ts`)
   - Gestisce la raccolta e l'analisi delle metriche
   - Mantiene storico delle ultime 10.000 richieste
   - Calcola metriche aggregate in tempo reale

2. **MetricsInterceptor** (`backend/src/common/interceptors/metrics.interceptor.ts`)
   - Cattura tutte le richieste HTTP
   - Registra tempo di risposta, status code, utente
   - Estrae informazioni IP e User-Agent

3. **AdminService** (aggiornato)
   - Utilizza MetricsService per metriche reali
   - Fornisce endpoint per dashboard admin

## 📈 Metriche Disponibili

### Metriche di Sistema (24h)
- **Total Requests**: Numero totale di richieste
- **Successful Requests**: Richieste con status < 400
- **Failed Requests**: Richieste con status >= 400
- **Average Response Time**: Tempo medio di risposta (ms)
- **Error Rate**: Percentuale di errori
- **Requests Per Minute**: Richieste al minuto (ultima ora)
- **Unique Users**: Utenti unici attivi

### Metriche Dettagliate
- **Top Endpoints**: Endpoint più utilizzati
- **Error Breakdown**: Distribuzione errori per status code
- **Hourly Metrics**: Metriche orarie ultimi 7 giorni
- **User Activity**: Attività utente basata su login

### Alert Automatici
- **High Error Rate**: > 5% errori (error), > 2% (warning)
- **High Response Time**: > 2000ms
- **Low Activity**: < 1 richiesta/minuto
- **High Load**: > 100 richieste/minuto

## 🔧 Implementazione

### Registrazione Richieste

```typescript
// MetricsInterceptor cattura automaticamente:
{
  timestamp: Date,
  method: 'GET',
  path: '/api/users',
  statusCode: 200,
  responseTime: 150,
  userAgent: 'Mozilla/5.0...',
  ipAddress: '192.168.1.100',
  userId: 'user-uuid',
  userEmail: 'user@example.com'
}
```

### Calcolo Metriche

```typescript
// Esempio calcolo error rate
const errorRate = (failedRequests / totalRequests) * 100;

// Esempio calcolo response time medio
const avgResponseTime = totalResponseTime / totalRequests;

// Esempio utenti unici
const uniqueUsers = new Set(requests.map(r => r.userId)).size;
```

## 🚀 Endpoint API

### Metriche Base
```
GET /admin/metrics
```

**Risposta:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "total_users": 150,
      "active_users": 45,
      "new_users_today": 3,
      "total_requests": 1250,
      "error_rate": 1.2
    },
    "charts": {
      "user_growth": [...],
      "request_volume": [...]
    },
    "alerts": [...]
  }
}
```

### Metriche Dettagliate
```
GET /admin/metrics/detailed
```

**Risposta:**
```json
{
  "success": true,
  "data": {
    "system": {
      "totalRequests": 1250,
      "successfulRequests": 1235,
      "failedRequests": 15,
      "averageResponseTime": 245.5,
      "errorRate": 1.2,
      "requestsPerMinute": 2.1,
      "uniqueUsers": 45,
      "topEndpoints": [
        {"path": "GET /api/auth/login", "count": 89},
        {"path": "GET /api/users/profile", "count": 67}
      ],
      "errorBreakdown": [
        {"statusCode": 404, "count": 8},
        {"statusCode": 500, "count": 7}
      ]
    },
    "hourly": [...],
    "alerts": [...],
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

## 📊 Dashboard Integration

### Frontend Updates

Il frontend può ora mostrare:
- **Metriche reali** invece di dati simulati
- **Trend temporali** basati su dati effettivi
- **Alert dinamici** che si aggiornano automaticamente
- **Performance monitoring** in tempo reale

### Esempio React/Angular

```typescript
// Aggiornamento automatico ogni 30 secondi
setInterval(() => {
  this.adminService.getMetrics().subscribe(metrics => {
    this.updateDashboard(metrics);
  });
}, 30000);
```

## 🔍 Monitoraggio e Debug

### Log Files
- **audit.log**: Eventi di sicurezza e autenticazione
- **log.txt**: Log generali dell'applicazione
- **Metrics in-memory**: Ultime 10.000 richieste

### Debug Commands

```bash
# Verifica metriche in tempo reale
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/admin/metrics/detailed

# Monitora log di audit
tail -f logs/audit.log

# Verifica performance
curl -w "@curl-format.txt" -o /dev/null -s \
  http://localhost:3000/admin/metrics
```

## ⚙️ Configurazione

### Soglie Alert (configurabili)
```typescript
// In MetricsService
const ALERT_THRESHOLDS = {
  ERROR_RATE_WARNING: 2.0,    // 2%
  ERROR_RATE_CRITICAL: 5.0,   // 5%
  RESPONSE_TIME_WARNING: 2000, // 2s
  LOW_ACTIVITY: 1,            // 1 req/min
  HIGH_LOAD: 100              // 100 req/min
};
```

### Retention Policy
- **Request Metrics**: Ultime 10.000 richieste (in-memory)
- **Audit Logs**: Persistente su file
- **Hourly Aggregates**: Ultimi 7 giorni

## 🚨 Alert System

### Tipi di Alert
1. **Error**: Error rate critico, errori 5xx
2. **Warning**: Performance degradata, errori elevati
3. **Info**: Attività bassa, manutenzione

### Esempio Alert
```json
{
  "id": "alert_error_rate_1704067200000",
  "type": "warning",
  "message": "Elevated error rate: 3.2%",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "resolved": false
}
```

## 🔄 Migrazione da Metriche Simulate

### Prima (Simulate)
```typescript
const totalRequests = recentLogs.length * 10; // Simulated
const errorRate = Math.random() * 0.05; // Random
```

### Dopo (Reali)
```typescript
const systemMetrics = await this.metricsService.getSystemMetrics();
const totalRequests = systemMetrics.totalRequests; // Real
const errorRate = systemMetrics.errorRate; // Calculated
```

## 📈 Benefici

1. **Accuratezza**: Dati reali invece di simulazioni
2. **Performance**: Monitoraggio in tempo reale
3. **Debugging**: Tracciamento dettagliato richieste
4. **Alerting**: Notifiche automatiche su problemi
5. **Scalabilità**: Metriche aggregate efficienti
6. **Compliance**: Audit trail completo

## 🔮 Roadmap

### Prossimi Sviluppi
- [ ] **Database Storage**: Persistenza metriche su DB
- [ ] **Real-time WebSocket**: Aggiornamenti live
- [ ] **Custom Dashboards**: Configurazione personalizzabile
- [ ] **Export Data**: Export metriche per analisi esterne
- [ ] **Machine Learning**: Predizione problemi
- [ ] **Integration**: Prometheus, Grafana, etc. 