# Logistics — Frontend

Angular 17 UI for the Logistics (Dachser) income and cost evaluation system.

Frontend only. The backend (Java 17 / Spring Boot) lives in the upstream repo:
https://github.com/adrianojlt/logistics

## How this is deployed

The UI is hosted on Vercel as a static bundle. The API calls are made by the
**browser**, not by Vercel's servers, so `apiUrl` points at `http://localhost:8080`
— the backend running on the local machine.

Consequence: the deployed site only works from a machine that is running the
backend locally. See `src/environments/environment.prod.ts` to change the target.

## Run the backend

From a clone of the upstream repo:

```bash
docker build --platform linux/amd64 -t dachser-backend .
docker run --platform linux/amd64 -d -p 8080:8333 \
  -e APP_SECURITY_ENABLE_LOGIN=false \
  --name dachser-backend dachser-backend
```

`APP_SECURITY_ENABLE_LOGIN=false` skips the login screen (the seeded passwords are
bcrypt hashes). Drop it to get the normal login flow.

The backend must allow this site's origin via `app.security.cors-allowed-origins`
(defaults include `https://*.vercel.app`).

## Run the frontend locally

```bash
npm install
npm start          # http://localhost:4200/dachser
```

## Build

```bash
npm run build -- --base-href /
```

Output: `dist/dachser-logistics-ui/browser`. Vercel picks this up via `vercel.json`.
