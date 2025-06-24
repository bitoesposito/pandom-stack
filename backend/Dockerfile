# API Dockerfile
FROM node:23-slim

WORKDIR /src/app

# Copia solo i file di dipendenze prima
COPY package*.json ./

# Installa le dipendenze
RUN npm install && \
    npm install pg --save && \
    npm i -g @nestjs/cli

# Copia il resto del codice
COPY . .

EXPOSE 3000

# Comando corretto (non puoi usare && con CMD)
CMD ["npm", "run", "start:dev"]