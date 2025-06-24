# Frontend Dockerfile  
FROM node:23-slim

WORKDIR /frontend

# Copia i file di dipendenze
COPY package*.json ./

# Installa le dipendenze
RUN npm install && \
npm install -g @angular/cli@19.2.10

# Copia il resto del codice
COPY . .

EXPOSE 4200

CMD ["ng", "serve", "--host", "0.0.0.0", "--disable-host-check", "--poll", "2000"]