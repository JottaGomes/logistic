import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ShipmentService } from '../../services/shipment.service';
import { COST_TYPES, INCOME_TYPES, Shipment, ShipmentDetail } from '../../models/shipment.model';

/**
 * Customer payment and operational cost administration (requirements 1.4).
 *
 * This is what satisfies the Calculate Profit pre-condition — "income and cost
 * data must be recorded in the system". Kept on its own page so the use case
 * under assessment stays a screen of its own.
 */
@Component({
  selector: 'app-record-data',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './record-data.component.html',
  styleUrl: './record-data.component.css',
})
export class RecordDataComponent implements OnInit {

  readonly incomeTypes = INCOME_TYPES;
  readonly costTypes = COST_TYPES;

  shipmentForm: FormGroup;
  incomeForm: FormGroup;
  costForm: FormGroup;

  shipments: Shipment[] = [];
  shipmentSearch = new FormControl('');
  selected: ShipmentDetail | null = null;

  errorMessage = '';
  successMessage = '';
  saving = false;

  constructor(
    private fb: FormBuilder,
    private shipmentService: ShipmentService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.shipmentForm = this.fb.group({
      reference: ['', [Validators.required, Validators.maxLength(30)]],
      customer: ['', [Validators.required, Validators.maxLength(100)]],
    });

    this.incomeForm = this.amountForm(INCOME_TYPES[0]);
    this.costForm = this.amountForm(COST_TYPES[0]);
  }

  private amountForm(defaultType: string): FormGroup {
    return this.fb.group({
      type: [defaultType, Validators.required],
      amount: [null, [Validators.required, Validators.min(0)]],
      description: ['', Validators.maxLength(255)],
    });
  }

  ngOnInit(): void {
    this.loadShipments();

    // same reason as the other screen: the backend hands out a bounded slice,
    // so narrowing has to happen there rather than over a list held here
    this.shipmentSearch.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged())
      .subscribe(term => this.loadShipments(term ?? ''));

    // ?shipment=SHP-... opens straight on that shipment, so a link can point at one
    const reference = this.route.snapshot.queryParamMap.get('shipment');

    if (reference) {
      this.select(reference);
    }
  }

  loadShipments(term = ''): void {
    this.shipmentService.findShipments(term).subscribe({
      next: shipments => {
        this.shipments = shipments;

        if (shipments.length && !this.selected) {
          this.select(shipments[0].reference);
        }
      },
      error: error => (this.errorMessage = this.describe(error, 'Could not load the shipments')),
    });
  }

  select(reference: string): void {
    this.clearMessages();
    this.router.navigate([], { queryParams: { shipment: reference }, replaceUrl: true });
    this.shipmentService.findShipment(reference).subscribe({
      next: detail => (this.selected = detail),
      error: error => (this.errorMessage = this.describe(error, 'Could not load that shipment')),
    });
  }

  createShipment(): void {

    if (this.shipmentForm.invalid || this.saving) {
      return;
    }

    this.clearMessages();
    this.saving = true;

    const { reference, customer } = this.shipmentForm.value;

    this.shipmentService.createShipment(reference, customer).subscribe({
      next: created => {
        this.saving = false;
        this.shipmentForm.reset();
        this.successMessage = `Shipment ${created.reference} created`;
        this.loadShipments();
        this.select(created.reference);
      },
      error: error => {
        this.saving = false;
        this.errorMessage = this.describe(error, 'Could not create the shipment');
      },
    });
  }

  addIncome(): void {
    this.record(this.incomeForm, (reference, type, amount, description) =>
      this.shipmentService.recordIncome(reference, type, amount, description), 'Income recorded');
  }

  addCost(): void {
    this.record(this.costForm, (reference, type, amount, description) =>
      this.shipmentService.recordCost(reference, type, amount, description), 'Cost recorded');
  }

  /** Both amount forms behave identically; only the endpoint differs. */
  private record(
    form: FormGroup,
    call: (reference: string, type: string, amount: number, description: string) => import('rxjs').Observable<ShipmentDetail>,
    success: string,
  ): void {

    if (form.invalid || !this.selected || this.saving) {
      return;
    }

    this.clearMessages();
    this.saving = true;

    const { type, amount, description } = form.value;

    call(this.selected.reference, type, amount, description ?? '').subscribe({
      next: detail => {
        this.saving = false;
        this.selected = detail;
        this.successMessage = success;
        form.reset({ type, amount: null, description: '' });
      },
      error: error => {
        this.saving = false;
        this.errorMessage = this.describe(error, 'Could not record that amount');
      },
    });
  }

  goCalculate(): void {
    this.router.navigate(['/calculate-profit']);
  }

  label(type: string): string {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private describe(error: HttpErrorResponse, fallback: string): string {

    if (error.status === 0) {
      return 'Could not reach the server. Check that the backend is running.';
    }

    return error.error?.message ?? fallback;
  }
}
