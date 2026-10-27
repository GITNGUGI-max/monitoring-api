# Monitoring API

A Node.js and Express application that reports its health,
process uptime, and memory usage, and saves HTTP request logs.

## Run locally

Requirements: Node.js and npm.

```bash
npm install
npm start
```

## Endpoints

- GET /health — returns application status.
- GET /metrics — returns process uptime in seconds and RSS memory in MB.

The API runs at http://localhost:3001.

## Request logs

Requests are printed to the terminal and appended to request.log
in the directory where the application is started.

Each entry includes a UTC timestamp, HTTP method, path,
and response status code.

## Skills practised

Node.js, Express, HTTP, JSON, middleware, process metrics,
and asynchronous file operations.