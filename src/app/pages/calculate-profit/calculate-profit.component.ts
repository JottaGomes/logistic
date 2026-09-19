import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ShipmentService } from '../../services/shipment.service';
import { ProfitCalculation, Shipment } from '../../models/shipment.model';
import { CalculationResultComponent } from '../../components/calculation-result/calculation-result.component';

/**
 * Calculate Profit, step 1: the Finance Department picks a shipment and asks for
 * it to be evaluated. The amounts are not entered here — they are already
 * recorded against the shipment, and the backend sums them.
 */
@Component({
  selector: 'app-calculate-profit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatProgressBarModule,
    CalculationResultComponent,
  ],
  templateUrl: './calculate-profit.component.html',
  styleUrl: './calculate-profit.component.css',
})
export class CalculateProfitComponent implements OnInit {

  @ViewChild(MatSort) sort?: MatSort;

  form: FormGroup;
  search = new FormControl('');

  shipments: Shipment[] = [];
  calculations: ProfitCalculation[] = [];
  result: ProfitCalculation | null = null;

  displayedColumns = ['shipmentReference', 'customer', 'totalIncome', 'totalCosts', 'profitOrLoss', 'calculatedAt'];

  loading = false;
  loadingHistory = false;
  errorMessage = '';

  totalElements = 0;
  pageSize = 10;
  pageIndex = 0;
  sortColumn = 'calculatedAt';
  sortDirection: 'asc' | 'desc' = 'desc';

  constructor(private fb: FormBuilder, private shipmentService: ShipmentService) {
    this.form = this.fb.group({
      shipmentReference: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadShipments();
    this.loadCalculations();

    // wait for a pause in typing, so one search is not eight requests
    this.search.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadCalculations();
      });
  }

  loadShipments(): void {
    this.shipmentService.findShipments().subscribe({
      next: shipments => (this.shipments = shipments),
      error: error => (this.errorMessage = this.describe(error, 'Could not load the shipments')),
    });
  }

  loadCalculations(): void {

    this.loadingHistory = true;

    this.shipmentService
      .findCalculations(this.pageIndex, this.pageSize, this.sortColumn, this.sortDirection, this.search.value ?? '')
      .subscribe({
        next: page => {
          this.calculations = page.content;
          this.totalElements = page.totalElements;
          this.loadingHistory = false;
        },
        error: error => {
          this.loadingHistory = false;
          this.errorMessage = this.describe(error, 'Could not load previous calculations');
        },
      });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadCalculations();
  }

  /** Sorting is server-side, because only one page is ever in the browser. */
  onSortChange(event: Sort): void {
    this.sortColumn = event.direction ? event.active : 'calculatedAt';
    this.sortDirection = (event.direction || 'desc') as 'asc' | 'desc';
    this.pageIndex = 0;
    this.loadCalculations();
  }

  /** Re-opens a stored calculation. It carries totals but not the lines behind them. */
  openCalculation(calculation: ProfitCalculation): void {
    this.result = calculation;
  }

  clearSearch(): void {
    this.search.setValue('');
  }

  onCalculate(): void {

    if (this.form.invalid || this.loading) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.shipmentService.calculate(this.form.value.shipmentReference).subscribe({
      next: result => {
        this.result = result;
        this.loading = false;
        this.pageIndex = 0;
        this.loadCalculations();
      },
      error: error => {
        this.loading = false;
        this.errorMessage = this.describe(error, 'The calculation could not be completed');
      },
    });
  }

  /**
   * Alternative flow I: surface what the backend reported when it is useful,
   * and fall back to a readable sentence when it is not.
   */
  private describe(error: HttpErrorResponse, fallback: string): string {

    if (error.status === 0) {
      return 'Could not reach the server. Check that the backend is running.';
    }

    return error.error?.message ?? fallback;
  }
}
