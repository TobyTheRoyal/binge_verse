# BingeVerse Backend
BingeVerse ist ein Backend-Service auf Basis von [NestJS](https://nestjs.com/), der Filme und Serien über die APIs von TMDB und OMDB aggregiert. Nutzer können sich registrieren, Inhalte suchen, persönliche Watchlists verwalten und Bewertungen abgeben.

## Features
- **JWT-Authentifizierung** für Registrierung und Login
- **Trending**, **Top Rated** und **New Releases** von TMDB
- **Suche** mit Filtern (Genre, Erscheinungsjahr, Anbieter, IMDb/Rotten-Tomatoes-Wertung)
- **Watchlist** für eingeloggte Nutzer mit optionaler Bewertung
- **Zeitgesteuerte Updates**: Cron-Job aktualisiert täglich die gecachten Listen
- **PostgreSQL** Datenbank via TypeORM

## Voraussetzungen
- Node.js 20+
- PostgreSQL

## Installation
1. Repository klonen und Abhängigkeiten installieren

```bash
   git clone <repo-url>
   cd backend
   npm install
   ```
2. Eine `.env` Datei anhand von `.env.example` anlegen und folgende Variablen setzen:

```text
   PORT=3000
   CORS_ORIGIN=http://localhost:4200
   TYPEORM_SYNC=false
   DB_HOST=postgres
   DB_PORT=5432
   DB_USERNAME=streamfinder
   DB_PASSWORD=securepass
   DB_DATABASE=streamfinder
   JWT_SECRET=super-secret
   TMDB_API_KEY=dein-tmdb-key
   OMDB_API_KEY=dein-omdb-key
   ```

## Starten des Servers

```bash
npm run start:dev
```

Der Server läuft standardmäßig unter `http://localhost:3000`.

## Weitere Skripte
- `npm run start` – Entwicklung
- `npm run start:dev` – Watch-Mode
- `npm run start:prod` – Produktionsbetrieb
- `npm run test` – Unit Tests
- `npm run test:e2e` – End-to-End Tests
- `npm run test:cov` – Testabdeckung

## Docker
```bash
docker build -t streamfinder-backend .
docker run --env-file .env -p 3000:3000 streamfinder-backend
```
## API-Übersicht

- `POST /auth/register` – neuen Nutzer anlegen
- `POST /auth/login` – JWT erhalten
- `GET /content/trending` – Trends abrufen
- `GET /content/top-rated` – bestbewertete Filme
- `GET /content/new-releases` – Neuerscheinungen
- `GET /content/movies-page` – paginierte Filme mit Filtern
- `GET /content/series-page` – paginierte Serien mit Filtern
- `GET /content/genres` – verfügbare Genres
- `POST /watchlist/add` – Inhalt zur Watchlist hinzufügen (JWT erforderlich)
- `POST /watchlist/rate` – Bewertung setzen
- `GET /watchlist` – eigene Watchlist
- `DELETE /watchlist/user/:tmdbId` – Inhalt entfernen
- `POST /ratings` – Inhalt bewerten
- `GET /ratings` – Bewertungen des Nutzers

## Tests

```bash
npm run test
npm run test:e2e
```

## Lizenz

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
