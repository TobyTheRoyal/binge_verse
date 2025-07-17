# BingeVerse

BingeVerse is a full stack web application that aggregates movies and TV series using the APIs from [TMDB](https://www.themoviedb.org/) and [OMDB](https://www.omdbapi.com/). It provides a NestJS based backend and an Angular frontend so users can register, search for content, maintain a personal watchlist and rate titles.

## Features

- JWT based authentication for registration and login
- Trending, Top Rated and New Releases from TMDB
- Search with filters for genre, release year, streaming provider and ratings
- Personal watchlists with optional ratings
- Scheduled updates that refresh cached lists daily
- PostgreSQL database via TypeORM

## Repository structure

- `backend` – NestJS server providing the REST API
- `frontend` – Angular web application
- `docker` – Docker Compose configuration with PostgreSQL, backend and frontend services

## Getting started

### Prerequisites

- Node.js 20+ and npm
- Docker (optional, for containerized setup)
- PostgreSQL if you do not use Docker

### Clone the repository

```bash
git clone <repo-url>
cd binge_verse
```

### Backend configuration

Create a `.env` file inside `backend` based on `.env.example` and adjust the values:

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
TMDB_API_KEY=your-tmdb-key
OMDB_API_KEY=your-omdb-key
```

### Running with Docker Compose

The easiest way to start the entire stack is via Docker Compose. First copy the sample
environment file and insert your API keys:

```bash
cp docker/.env.example docker/.env
# edit docker/.env and set TMDB_API_KEY and OMDB_API_KEY
```

From the `docker` directory run:

```bash
docker-compose up --build
```

This will start PostgreSQL, the NestJS backend on port `3000` and the Angular frontend on port `4200`.

### Running manually

If you prefer to run the services directly on your machine:

1. Ensure PostgreSQL is running with the credentials from your `.env` file.
2. Start the backend:

   ```bash
   cd backend
   npm install
   npm run start:dev
   ```

3. Start the frontend in a separate terminal:

   ```bash
   cd frontend
   npm install
   npm start
   ```

The application will be available at `http://localhost:4200` and will communicate with the backend at `http://localhost:3000`.

## License

This project is provided under the MIT license.