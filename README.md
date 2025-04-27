# Project Setup

This project uses Docker Compose for easy development.

## Requirements

- Docker and Docker Compose installed
- A `.env` file with:
    - `GOOGLE_CLIENT_ID`
    - `GOOGLE_CLIENT_SECRET`

Example `.env`:

```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## How to Run

```bash
docker-compose up --build
```

The app will be available at [http://localhost:8080](http://localhost:8080).

## Notes

- Environment: `NODE_ENV=development`
- Data is stored in a Docker volume (`app_data`).
- To stop:

```bash
docker-compose down
```
