import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ProfitCalculation } from '../../models/shipment.model';

/**
 * Presentational child component: it renders the calculation handed to it and
 * owns no state of its own.
 *
 * Data in  — @Input() calculation, set by the parent page.
 * Data out — @Output() dismissed, so the parent decides what closing means.
 */
@Component({
  selector: 'app-calculation-result',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './calculation-result.component.html',
  styleUrl: './calculation-result.component.css',
})
export class CalculationResultComponent {

  @Input({ required: true }) calculation!: ProfitCalculation;

  @Output() dismissed = new EventEmitter<void>();

  get isProfit(): boolean {
    return this.calculation.profitOrLoss >= 0;
  }
}
