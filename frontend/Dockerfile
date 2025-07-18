# # Basis-Image: Node.js zum Bauen der Angular-App
# FROM node:20-alpine AS builder

# # Installiere Build-Tools für native Abhängigkeiten
# RUN apk add --no-cache python3 make g++ bash

# # Arbeitsverzeichnis im Container
# WORKDIR /app

# # Kopiere package.json und package-lock.json
# COPY package*.json ./

# # Installiere Abhängigkeiten
# RUN npm install

# # Installiere Angular CLI global
# RUN npm install -g @angular/cli@19

# # Kopiere den gesamten Quellcode
# COPY . .

# # Baue die Angular-Anwendung für Produktion
# RUN ng build --configuration production

# # Zweite Stufe: Nginx zum Bereitstellen der statischen Dateien
# FROM nginx:alpine

# # Entferne Standarddateien
# RUN rm -rf /usr/share/nginx/html/*

# # Kopiere nur den browser-Ordner-Inhalt
# COPY --from=builder /app/dist/film-series-platform/browser/* /usr/share/nginx/html/

# # Kopiere die benutzerdefinierte Nginx-Konfiguration
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# # Exponiere Port 80
# EXPOSE 80

# # Starte Nginx
# CMD ["nginx", "-g", "daemon off;"] 

FROM node:20-alpine AS builder
RUN apk add --no-cache python3 make g++ bash
WORKDIR /app
COPY package*.json ./
RUN npm install
RUN npm install -g @angular/cli@19
COPY . .
RUN ng build --configuration production

FROM nginx:alpine
# Entferne alle Standarddateien und Konfigurationen
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/*
# Kopiere Build-Dateien
COPY --from=builder /app/dist/bingeverse /usr/share/nginx/html/
# Kopiere nginx.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]