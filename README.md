# Project Setup

This project uses Docker Compose for easy development.

## Requirements

- Docker and Docker Compose installed
- A `.env` file is needed only for the services you choose to use.

Example `.env` (Google Drive):

To connect to specific providers, you may need to include the appropriate .env variables.

| provider     | .env variable                              |
| ------------ | ------------------------------------------ |
| google-drive | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |

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

## How to Use

To connect to servers, you may need to include headers in your requests. For authentication, use the `x-access-token` header. Here's an example:

```bash
curl -H "x-access-token: <your_access_token>" http://localhost:8080/api/resource
```

Replace `<your_access_token>` with your actual access token.

Optionally, you can also include the `x-refresh-token` header with your refresh token if required by the server.

## Notes

- Environment: `NODE_ENV=development`
- Data is stored in a Docker volume (`app_data`).
- To stop:

```bash
docker-compose down
```
