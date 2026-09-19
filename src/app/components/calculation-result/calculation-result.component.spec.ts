import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CalculationResultComponent } from './calculation-result.component';
import { ProfitCalculation } from '../../models/shipment.model';

describe('CalculationResultComponent', () => {

  let fixture: ComponentFixture<CalculationResultComponent>;
  let component: CalculationResultComponent;

  const calculation: ProfitCalculation = {
    id: 1,
    shipmentReference: 'SHP-2026-0001',
    customer: 'Sonae',
    totalIncome: 5300,
    totalCosts: 3200,
    profitOrLoss: 2100,
    calculatedAt: '2026-09-19T10:00:00',
    incomes: [{ id: 1, type: 'CUSTOMER_PAYMENT', amount: 5300, description: 'Invoice' }],
    costs: [{ id: 1, type: 'MAIN_CARRIAGE', amount: 3200, description: 'Line haul' }],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CalculationResultComponent] }).compileComponents();
    fixture = TestBed.createComponent(CalculationResultComponent);
    component = fixture.componentInstance;
  });

  it('treats a non-negative result as a profit', () => {
    component.calculation = calculation;
    expect(component.isProfit).toBeTrue();
  });

  it('treats a negative result as a loss', () => {
    component.calculation = { ...calculation, profitOrLoss: -1500 };
    expect(component.isProfit).toBeFalse();
  });

  it('renders the amounts it was given as currency', () => {
    component.calculation = calculation;
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('SHP-2026-0001');
    expect(text).toContain('5,300.00');
  });

  it('emits when dismissed, instead of hiding itself', () => {
    component.calculation = calculation;
    fixture.detectChanges();

    let emitted = false;
    component.dismissed.subscribe(() => (emitted = true));

    const button = (fixture.nativeElement as HTMLElement).querySelector('button');
    button?.dispatchEvent(new Event('click'));

    expect(emitted).toBeTrue();
  });
});
