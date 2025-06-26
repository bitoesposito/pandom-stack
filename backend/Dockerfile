# API Dockerfile
FROM node:23-slim

WORKDIR /src/app

# Installa PostgreSQL client tools versione 17 per compatibilità
RUN apt-get update && \
    apt-get install -y wget gnupg2 lsb-release && \
    sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list' && \
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - && \
    apt-get update && \
    apt-get install -y postgresql-client-17 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copia solo i file di dipendenze prima
COPY package*.json ./

# Installa le dipendenze
RUN npm install && \
    npm install pg --save && \
    npm i -g @nestjs/cli

# Copia il resto del codice
COPY . .

# Crea directory per i backup
RUN mkdir -p /src/app/backups

EXPOSE 3000

# Comando corretto (non puoi usare && con CMD)
CMD ["npm", "run", "start:dev"]