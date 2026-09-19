# Logistics — Calculate Profit (Frontend)

Angular UI for the Calculate Profit use case of the Logistics income and cost
evaluation system.

This repository covers **Example 2 — Angular Frontend Implementation**. The Spring
Boot backend (Example 1) is at https://github.com/JottaGomes/logistic-be.

## Stack

Angular 17 (standalone components), Angular Material, Jasmine + Karma for tests.

No CSS framework. Design tokens live in `src/styles.css` and everything else is
component-scoped — Bootstrap was pulled in for eight utility classes and a grid
the layout no longer uses, and having two design systems side by side was the
main reason the spacing and typography never quite agreed.

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

34 specs. With coverage:

```bash
npm test -- --watch=false --browsers=ChromeHeadless --code-coverage
```

```
Statements   : 83.06% ( 152/183 )
Branches     : 75.00% (  30/40 )
Functions    : 71.23% (  52/73 )
Lines        : 83.24% ( 149/179 )
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

The `.html` sources are alongside them. They are the prototypes drawn before the
implementation, so they show the intended structure rather than the final styling.

## Structure

```
models/       Shipment, AmountLine, ProfitCalculation, Page
services/     ShipmentService (backend calls), AuthService (session)
components/   calculation-result — presentational child, @Input in / @Output out
pages/        calculate-profit (the use case), record-data (administration),
              login, register
guards/       authGuard
interceptors/ authInterceptor — attaches the JWT to every request
```

**Shell.** A top bar carries the page title and the signed-in user; the sidebar is
brand plus navigation. Tables run at back-office density (38px header, 40px rows),
numbers are right-aligned with tabular figures, and profit and loss are coloured.

**Two screens.** *Calculate Profit* is the use case under assessment. *Record Data*
is what satisfies its pre-condition — customer payment and operational cost
administration, from section 1.4 of the requirements — and is kept separate so the
use case stays self-contained. `?shipment=SHP-...` opens it on one shipment.

The calculation screen is a parent/child pair on purpose: `CalculateProfitComponent` holds the
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
| Jasmine unit tests (optional) | 34 specs, `npm test` |
| Coverage report (optional) | `--code-coverage`, 83.06% statements |
