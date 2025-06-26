# Email Template System

## Overview

Il sistema di template email è stato completamente ristrutturato per essere modulare e flessibile. I template HTML sono ora separati dal codice e utilizzano uno stile semplice e pulito con codici invece di link.

## Struttura

### Template Disponibili

- **`email-verification.template.html`** - Email di verifica account (codice)
- **`password-reset.template.html`** - Email di reset password (codice)

### Variabili Template

I template utilizzano variabili nel formato `{{variableName}}`:

#### Verification Template
- `{{verificationCode}}` - Codice di verifica

#### Password Reset Template
- `{{resetCode}}` - Codice di reset password

## Stile dei Template

Tutti i template seguono uno stile comune:
- **Design minimalista** e pulito
- **Codici evidenziati** con stile monospace e sfondo grigio
- **Font Arial/Helvetica** per massima compatibilità
- **Footer standard** con disclaimer
- **CSS inline** per compatibilità cross-client

## Utilizzo

### Nel Codice

```typescript
// Email di verifica (invia codice)
await this.mailService.sendVerificationEmail(userEmail, token);

// Email di reset password (invia codice)
await this.mailService.sendPasswordResetEmail(userEmail, token);
```

### API Endpoints

#### GET /email/templates
Ottiene la lista dei template disponibili.

#### POST /email/test
Invia un'email di test con un template specifico.

```json
{
  "to": "test@example.com",
  "templateType": "verification",
  "data": {
    "verificationCode": "ABC123XYZ"
  }
}
```

#### POST /email/clear-cache
Pulisce la cache dei template.

## Personalizzazione

### Aggiungere un Nuovo Template

1. Crea un nuovo file `nome-template.template.html` in `src/common/templates/`
2. Segui lo stile comune con CSS inline
3. Aggiungi il tipo nel `EmailTemplateType` in `template.service.ts`
4. Aggiungi il subject di default nel `MailService`

### Modificare un Template Esistente

I template sono file HTML standard con CSS inline. Puoi modificare:
- Stili CSS (mantieni l'inline per compatibilità)
- Layout HTML
- Testi e contenuti
- Variabili utilizzate

### Cache

I template vengono cacheati automaticamente per migliorare le performance. Usa l'endpoint `/email/clear-cache` per forzare il reload dei template.

## Configurazione SMTP

Assicurati di avere queste variabili d'ambiente configurate:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
FE_URL=http://localhost:4200
```

## Best Practices

1. **Sempre testare** i template prima del deploy
2. **Usare CSS inline** per massima compatibilità
3. **Mantenere lo stile semplice** e pulito
4. **Includere sempre** il footer con disclaimer
5. **Testare su diversi client email** (Gmail, Outlook, etc.)
6. **Usare codici invece di link** per maggiore sicurezza

## Troubleshooting

### Template non trovato
- Verifica che il file esista in `src/common/templates/`
- Controlla che il nome del file sia `nome.template.html`
- Pulisci la cache con `/email/clear-cache`

### Email non inviate
- Verifica la configurazione SMTP
- Controlla i log per errori specifici
- Testa la connessione SMTP

### Variabili non sostituite
- Verifica che le variabili nel template usino il formato `{{variableName}}`
- Controlla che i dati passati al template contengano le chiavi corrette 