# logistics-frontend

Angular frontend of the Dachser logistics assessment: record shipments with their
income and costs, calculate profit, browse past calculations, and chat with the
Dachser AI assistant.

The backend is a separate repository, `JottaGomes/logistic-be`, usually checked out
next to this one as `../logistic-be`. Its `CLAUDE.md` holds the API table, error codes
and secrets rules. A change to an endpoint or DTO is a change in both repositories.

## Stack and commands

Angular 17 standalone components, Angular Material, reactive forms, HttpClient with a
JWT interceptor, Karma/Jasmine.

- Run: `npm start` (http://localhost:4200).
- Test: `npx ng test --watch=false --browsers=ChromeHeadless` (58 specs).
- Build: `npx ng build`. Component CSS has a 2 kB warning and 4 kB error budget
  (`angular.json`); several components already exceed the warning, none may reach the error.
- Deploy: Vercel builds `main` automatically (`vercel.json`).

`environment.apiUrl` is `http://localhost:8080` in both environments: the deployed
frontend talks to a backend running on the user's own machine, which allows the
`*.vercel.app` origin through CORS.

Layout under `src/app/`: `pages` (record-data, calculate-profit, login, register), `components`
(calculation-result, chat-assistant), `services`, `models`, `interceptors`, `guards`.
`FRONTEND_QUESTIONS.md` answers the assessment questions by pointing at this code; keep
it true.

## Conventions

- Clear a submitted form with `FormGroupDirective.resetForm()` (template reference
  `#ref="ngForm"`), not `form.reset()`, or the fields show as invalid afterwards.
- Every `<form>` with a submit handler needs `[formGroup]`, or Enter reloads the page.
- Colours come from the CSS variables in `src/styles.scss`: `--profit` (green) for income
  and profit, `--loss` (red) for costs and loss. Both have dark-mode values, so never
  hard-code the colour.
- Shipment pickers search the server (`findShipments(term)`), never filter a full list:
  the backend may hold 10,000 shipments.

## Working rules

- Code comments follow the `code-comments` skill: English, explain why, self-contained.
- Commit and push only when asked; end commit messages with the Co-Authored-By line.
