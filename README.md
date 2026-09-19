# Logistics — Calculate Profit (Frontend)

Angular UI for the Calculate Profit use case of the Logistics income and cost
evaluation system.

This repository covers **Example 2 — Angular Frontend Implementation**. The Spring
Boot backend (Example 1) is at https://github.com/JottaGomes/logistic-be.

## Stack

Angular 17 (standalone components), Angular Material, Bootstrap 5.3 for layout,
Jasmine + Karma for tests.

## Run it

Start the backend first (see its README — `mvn spring-boot:run`, no database to
install), then:

```bash
npm install
npm start
```

http://localhost:4200

`src/environments/environment.ts` points at `http://localhost:8080`.

## Tests

```bash
npm test -- --watch=false --browsers=ChromeHeadless
```

12 specs. With coverage:

```bash
npm test -- --watch=false --browsers=ChromeHeadless --code-coverage
```

```
Statements   : 90.38% ( 47/52 )
Branches     : 62.5%  ( 5/8 )
Functions    : 86.36% ( 19/22 )
Lines        : 90%    ( 45/50 )
```

The HTML report lands in `coverage/`.

## Wireframes

`wireframes/` — three PNGs for the Calculate Profit screen, produced before the
implementation:

| File | State |
|---|---|
| `01-calculate-profit-initial.png` | nothing selected, history listed |
| `02-calculate-profit-result.png` | a profit, with its income and cost breakdown |
| `03-calculate-profit-loss-and-error.png` | a loss, and both error states |

The `.html` sources are alongside them.

## Structure

```
models/       Shipment, AmountLine, ProfitCalculation, Page
services/     ShipmentService (backend calls), AuthService (session)
components/   calculation-result — presentational child, @Input in / @Output out
pages/        calculate-profit (the use case), login, register
guards/       authGuard
interceptors/ authInterceptor — attaches the JWT to every request
```

The screen is a parent/child pair on purpose: `CalculateProfitComponent` holds the
state and talks to the service; `CalculationResultComponent` only renders what it
is handed and emits when dismissed.

Design notes and reasoning in **[FRONTEND_QUESTIONS.md](FRONTEND_QUESTIONS.md)**.

## Deployment

Hosted on Vercel as a static bundle. `vercel.json` sets the build command
(`--base-href /`), the output directory and the SPA rewrite.

The API calls are made by the **browser**, so `environment.prod.ts` pointing at
`http://localhost:8080` means the deployed site only works from a machine running
the backend locally. Point `apiUrl` at a reachable host to change that.

## Assessment deliverables

| Required | Where |
|---|---|
| Wireframes for Calculate Profit (`.png`) | `wireframes/` |
| Source code that builds and serves | this repository, `npm start` |
| Model / Components / Service / Form / Routing | `src/app/...` |
| Frontend question answers | [FRONTEND_QUESTIONS.md](FRONTEND_QUESTIONS.md) |
| Jasmine unit tests (optional) | 12 specs, `npm test` |
| Coverage report (optional) | `--code-coverage`, 90.38% statements |
