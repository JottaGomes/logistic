# Frontend questions

Answers to the five Angular questions in the assessment, written against the code
in this repository. File references point at the real thing.

---

## 1. How do you implement form validation in Angular?

Reactive forms, with the rules declared in TypeScript rather than in the template.

The calculation form has one control and one rule
(`pages/calculate-profit/calculate-profit.component.ts`):

```ts
this.form = this.fb.group({
  shipmentReference: ['', Validators.required],
});
```

The template binds to it and reacts to its state:

```html
<button ... [disabled]="form.invalid || loading">Calculate</button>

@if (form.get('shipmentReference')?.hasError('required') && form.get('shipmentReference')?.touched) {
  <mat-error>Pick a shipment to evaluate</mat-error>
}
```

The `touched` check matters: without it the form greets the user with an error
before they have done anything.

The registration form shows the two other pieces
(`pages/register/register.component.ts`). **Built-in validators composed on a
control:**

```ts
username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
```

and a **custom cross-field validator on the group**, because "the passwords match"
is not a property of either field alone:

```ts
}, { validators: passwordsMatch });

function passwordsMatch(group: AbstractControl) {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return !confirm || password === confirm ? null : { passwordsMismatch: true };
}
```

Why reactive rather than template-driven: the rules are in the class, so they are
unit-testable without rendering anything — `calculate-profit.component.spec.ts`
asserts that an invalid form never reaches the service, with no DOM involved.

Client-side validation is a convenience, never a guarantee. The same rules exist
on the server (`@NotBlank`, `@Size`), and the UI handles a 400 coming back anyway.

## 2. What will you use to handle HTTP requests in Angular, and why?

Angular's own `HttpClient`, provided at bootstrap with `provideHttpClient(...)` in
`app.config.ts`. Not `fetch`, and not axios.

Three reasons that are specific rather than generic:

**It returns Observables, and the rest of Angular speaks Observables.** Cancelling
an in-flight request when a component is destroyed, or composing calls with
`switchMap`, is native. With promises this means manual `AbortController`
plumbing.

**Interceptors.** Authentication is one function applied to every request
(`interceptors/auth.interceptor.ts`):

```ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();
  return token
    ? next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }))
    : next(req);
};
```

No service, anywhere, has to remember to attach the token. With `fetch` this
becomes a wrapper that every call site must be disciplined enough to use.

**A first-class testing story.** `provideHttpClientTesting` lets
`services/shipment.service.spec.ts` assert the exact URL, method and body, and
flush a canned response, with no network and no mocking library.

Adding axios would mean a second HTTP stack, a second error shape and no
interceptor integration, in exchange for nothing Angular does not already do.

## 3. How would you structure an Angular service for backend communication?

`services/shipment.service.ts` is the example. The principles:

**One service per bounded area, not per component.** `ShipmentService` owns
everything about shipments and calculations; `AuthService` owns tokens and
sessions. A component talks to a service, never to `HttpClient`.

**The service is the only place that knows the wire format.** The backend wraps
every response in `{ success, message, data }`. That envelope stops at the service
boundary:

```ts
findShipments(): Observable<Shipment[]> {
  return this.http.get<ApiResponse<Shipment[]>>(this.baseUrl).pipe(map(res => res.data));
}
```

Components receive `Shipment[]`. If the envelope changed, one file changes.

**The base URL comes from the environment, never from a literal.** ``private
readonly baseUrl = `${environment.apiUrl}/api/shipments` `` — so a build targets a
different backend without a code edit.

**Typed in and out.** The return types are the domain interfaces from
`models/shipment.model.ts`, so a renamed backend field is a compile error rather
than an `undefined` at runtime.

**`providedIn: 'root'`.** One instance, tree-shakeable if unused, and injectable
anywhere without touching a module.

**No state.** The service fetches; components hold what they are showing. A
service that also caches results becomes a second source of truth, and the bug
that follows is always "why is the screen showing the old number".

On SOLID: components depend on the service's public methods, so
`calculate-profit.component.spec.ts` swaps in a `jasmine.createSpyObj` and tests
the component with no HTTP layer at all.

## 4. How do you pass data between parent and child components?

This repository has a real parent/child pair, so the answer is concrete rather
than theoretical: `CalculateProfitComponent` (parent, holds the state) renders
`CalculationResultComponent` (child, renders what it is given).

**Down, with `@Input()`:**

```ts
@Input({ required: true }) calculation!: ProfitCalculation;
```

```html
<app-calculation-result [calculation]="result" (dismissed)="result = null" />
```

`required: true` makes a missing input a compile-time error.

**Up, with `@Output()` and an `EventEmitter`:**

```ts
@Output() dismissed = new EventEmitter<void>();
```

The child's close button emits; it does not hide itself. The parent owns `result`,
so the parent decides what dismissing means. A child that mutated its own input
would leave the two disagreeing about what is on screen —
`calculation-result.component.spec.ts` asserts the event fires precisely because
that is the contract.

**The other routes, and when they apply.** A shared injectable service (with a
`BehaviorSubject`) is the answer for components that are not in a
parent/child relationship, or when the tree is deep enough that threading an input
through intermediate components becomes noise. Route parameters carry state that
should survive a refresh or be linkable. `@ViewChild` reaches into a child
directly, and is worth avoiding for data — it couples the parent to the child's
internals, where `@Input` couples it only to the child's contract.

For this screen the pair is parent-and-direct-child and the data is transient, so
inputs and outputs are the right weight.

## 5. How would you handle and display errors from the backend API?

Three layers, because they fail differently.

**Distinguish the kinds of failure.** The backend answers with
`{ success, message, data }` even when it fails, so its own message is usually the
most useful thing to show. But a network failure has no body at all
(`calculate-profit.component.ts`):

```ts
private describe(error: HttpErrorResponse, fallback: string): string {
  if (error.status === 0) {
    return 'Could not reach the server. Check that the backend is running.';
  }
  return error.error?.message ?? fallback;
}
```

Status 0 means the request never arrived — the backend is down, or the browser
blocked it. Telling the user "the calculation failed" there would send them
looking in the wrong place. Asking for an unknown shipment yields a 404 whose
message names the reference, and that is worth showing verbatim.

**Show it where the user is looking, without destroying their work.** The message
renders in an alert next to the form; the selected shipment survives, so retrying
is one click. Nothing is swallowed into the console, and no `alert()` interrupts
anyone.

**Never leave the UI mid-action.** Every error path resets `loading`, so the
button and progress bar recover. This is the failure that turns a small error into
a stuck page.

Both branches are covered in `calculate-profit.component.spec.ts` — a 404 shows the
backend's message, a status 0 shows the connectivity message, and `loading` is
false in both.

**A note on what I would add for a larger app.** Cross-cutting concerns belong in
an `HttpInterceptor`: a 401 should clear the session and route to `/login` from one
place rather than from every subscriber, and retrying idempotent GETs on a
transient failure belongs there too. I kept this one focused because the assessment
covers a single use case, and an interceptor that exists to serve one screen is
indirection without payoff.
