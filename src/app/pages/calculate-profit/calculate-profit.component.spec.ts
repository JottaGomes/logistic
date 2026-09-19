import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { CalculateProfitComponent } from './calculate-profit.component';
import { ShipmentService } from '../../services/shipment.service';
import { ProfitCalculation, Shipment } from '../../models/shipment.model';

describe('CalculateProfitComponent', () => {

  let fixture: ComponentFixture<CalculateProfitComponent>;
  let component: CalculateProfitComponent;
  let service: jasmine.SpyObj<ShipmentService>;

  const shipments: Shipment[] = [{ id: 1, reference: 'SHP-1', customer: 'ACME' }];

  const calculation: ProfitCalculation = {
    id: 1,
    shipmentReference: 'SHP-1',
    customer: 'ACME',
    totalIncome: 1000,
    totalCosts: 400,
    profitOrLoss: 600,
    calculatedAt: '2026-09-19T10:00:00',
  };

  const emptyPage = { content: [], totalElements: 0, number: 0, size: 10 };

  beforeEach(async () => {
    service = jasmine.createSpyObj<ShipmentService>('ShipmentService',
      ['findShipments', 'calculate', 'findCalculations']);
    service.findShipments.and.returnValue(of(shipments));
    service.findCalculations.and.returnValue(of(emptyPage));

    await TestBed.configureTestingModule({
      imports: [CalculateProfitComponent],
      providers: [{ provide: ShipmentService, useValue: service }, provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(CalculateProfitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads the shipments and the history on init', () => {
    expect(service.findShipments).toHaveBeenCalled();
    expect(service.findCalculations).toHaveBeenCalled();
    expect(component.shipments).toEqual(shipments);
  });

  it('opens on the first shipment, so the form is usable straight away', () => {
    expect(component.form.value.shipmentReference).toBe('SHP-1');
  });

  it('requires a shipment before it will calculate', () => {
    component.form.setValue({ shipmentReference: '' });

    expect(component.form.invalid).toBeTrue();

    component.onCalculate();

    expect(service.calculate).not.toHaveBeenCalled();
  });

  it('keeps the result and refreshes the history after calculating', () => {
    service.calculate.and.returnValue(of(calculation));
    component.form.setValue({ shipmentReference: 'SHP-1' });

    component.onCalculate();

    expect(service.calculate).toHaveBeenCalledWith('SHP-1');
    expect(component.result).toEqual(calculation);
    expect(component.loading).toBeFalse();
    expect(service.findCalculations).toHaveBeenCalledTimes(2);
  });

  it('shows the message the backend sent when the shipment is unknown', () => {
    service.calculate.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 404,
      error: { success: false, message: 'No shipment found with reference SHP-1' },
    })));
    component.form.setValue({ shipmentReference: 'SHP-1' });

    component.onCalculate();

    expect(component.errorMessage).toBe('No shipment found with reference SHP-1');
    expect(component.loading).toBeFalse();
  });

  it('explains an unreachable backend rather than showing a blank error', () => {
    service.calculate.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    component.form.setValue({ shipmentReference: 'SHP-1' });

    component.onCalculate();

    expect(component.errorMessage).toContain('Could not reach the server');
  });

  it('asks the server to sort, because only one page is loaded', () => {
    component.onSortChange({ active: 'profitOrLoss', direction: 'asc' });

    expect(component.sortColumn).toBe('profitOrLoss');
    expect(component.sortDirection).toBe('asc');
    expect(component.pageIndex).toBe(0);
    expect(service.findCalculations)
      .toHaveBeenCalledWith(0, 10, 'profitOrLoss', 'asc', '');
  });

  it('falls back to the date when sorting is cleared', () => {
    component.onSortChange({ active: 'customer', direction: '' });

    expect(component.sortColumn).toBe('calculatedAt');
    expect(component.sortDirection).toBe('desc');
  });

  it('re-opens a stored calculation without calling the backend again', () => {
    service.calculate.calls.reset();

    component.openCalculation(calculation);

    expect(component.result).toEqual(calculation);
    expect(service.calculate).not.toHaveBeenCalled();
  });
});
