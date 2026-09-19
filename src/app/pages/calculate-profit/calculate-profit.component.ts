import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { HttpErrorResponse } from '@angular/common/http';
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
    MatTableModule,
    MatPaginatorModule,
    MatProgressBarModule,
    CalculationResultComponent,
  ],
  templateUrl: './calculate-profit.component.html',
  styleUrl: './calculate-profit.component.css',
})
export class CalculateProfitComponent implements OnInit {

  form: FormGroup;

  shipments: Shipment[] = [];
  calculations: ProfitCalculation[] = [];
  result: ProfitCalculation | null = null;

  displayedColumns = ['shipmentReference', 'customer', 'totalIncome', 'totalCosts', 'profitOrLoss', 'calculatedAt'];

  loading = false;
  errorMessage = '';

  totalElements = 0;
  pageSize = 10;
  pageIndex = 0;

  constructor(private fb: FormBuilder, private shipmentService: ShipmentService) {
    this.form = this.fb.group({
      shipmentReference: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadShipments();
    this.loadCalculations();
  }

  loadShipments(): void {
    this.shipmentService.findShipments().subscribe({
      next: shipments => (this.shipments = shipments),
      error: error => (this.errorMessage = this.describe(error, 'Could not load the shipments')),
    });
  }

  loadCalculations(): void {
    this.shipmentService.findCalculations(this.pageIndex, this.pageSize).subscribe({
      next: page => {
        this.calculations = page.content;
        this.totalElements = page.totalElements;
      },
      error: error => (this.errorMessage = this.describe(error, 'Could not load previous calculations')),
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadCalculations();
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
