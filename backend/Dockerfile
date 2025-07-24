# Basis-Image: Node.js (Version 18)
FROM node:20-alpine AS builder

RUN apk add --no-cache python3 make g++


# Arbeitsverzeichnis im Container
WORKDIR /app

# Kopiere package.json und package-lock.json
COPY package*.json ./

# Installiere Abhängigkeiten
RUN npm install

# Kopiere den gesamten Quellcode
COPY . .

# Baue die Anwendung (TypeScript zu JavaScript)
RUN npm run build

# Zweite Stufe: Production-Image
FROM node:20-alpine


WORKDIR /app

# Kopiere nur die notwendigen Dateien aus dem Builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/homeCache.json ./

# Installiere nur Produktionsabhängigkeiten
RUN npm install --production

# Exponiere Port 3000
EXPOSE 3000

# Starte die Anwendung
CMD ["node", "dist/main"]