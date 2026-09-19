import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { RecordDataComponent } from './record-data.component';
import { ShipmentService } from '../../services/shipment.service';
import { Shipment, ShipmentDetail } from '../../models/shipment.model';

describe('RecordDataComponent', () => {

  let fixture: ComponentFixture<RecordDataComponent>;
  let component: RecordDataComponent;
  let service: jasmine.SpyObj<ShipmentService>;

  const shipments: Shipment[] = [{ id: 1, reference: 'SHP-1', customer: 'ACME' }];

  const detail: ShipmentDetail = {
    id: 1,
    reference: 'SHP-1',
    customer: 'ACME',
    incomes: [],
    costs: [],
    totalIncome: 0,
    totalCosts: 0,
  };

  beforeEach(async () => {
    service = jasmine.createSpyObj<ShipmentService>('ShipmentService',
      ['findShipments', 'findShipment', 'createShipment', 'recordIncome', 'recordCost']);
    service.findShipments.and.returnValue(of(shipments));
    service.findShipment.and.returnValue(of(detail));

    await TestBed.configureTestingModule({
      imports: [RecordDataComponent],
      providers: [
        { provide: ShipmentService, useValue: service },
        provideNoopAnimations(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RecordDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('lists the shipments on init', () => {
    expect(component.shipments).toEqual(shipments);
  });

  it('opens on the first shipment instead of an empty page', () => {
    expect(service.findShipment).toHaveBeenCalledWith('SHP-1');
    expect(component.selected).toEqual(detail);
  });

  it('will not create a shipment without a reference and a customer', () => {
    expect(component.shipmentForm.invalid).toBeTrue();

    component.createShipment();

    expect(service.createShipment).not.toHaveBeenCalled();
  });

  it('selects the shipment it has just created', () => {
    service.createShipment.and.returnValue(of({ id: 2, reference: 'SHP-2', customer: 'Bosch' }));
    component.shipmentForm.setValue({ reference: 'SHP-2', customer: 'Bosch' });

    component.createShipment();

    expect(service.createShipment).toHaveBeenCalledWith('SHP-2', 'Bosch');
    expect(service.findShipment).toHaveBeenCalledWith('SHP-2');
  });

  it('reports a duplicate reference with the message the backend sent', () => {
    service.createShipment.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 409,
      error: { success: false, message: 'A shipment with reference SHP-1 already exists' },
    })));
    component.shipmentForm.setValue({ reference: 'SHP-1', customer: 'ACME' });

    component.createShipment();

    expect(component.errorMessage).toContain('already exists');
    expect(component.saving).toBeFalse();
  });

  it('records an income against the selected shipment and keeps the returned totals', () => {
    const updated: ShipmentDetail = { ...detail, totalIncome: 300, incomes: [
      { id: 1, type: 'AGENT_INCOME', amount: 300, description: 'Agent share' },
    ] };
    service.recordIncome.and.returnValue(of(updated));

    component.select('SHP-1');
    component.incomeForm.setValue({ type: 'AGENT_INCOME', amount: 300, description: 'Agent share' });

    component.addIncome();

    expect(service.recordIncome).toHaveBeenCalledWith('SHP-1', 'AGENT_INCOME', 300, 'Agent share');
    expect(component.selected?.totalIncome).toBe(300);
    expect(component.successMessage).toBe('Income recorded');
  });

  it('does not record an amount when no shipment is selected', () => {
    component.selected = null;
    component.costForm.setValue({ type: 'HANDLING', amount: 10, description: '' });

    component.addCost();

    expect(service.recordCost).not.toHaveBeenCalled();
  });

  it('rejects a negative amount before it reaches the backend', () => {
    component.select('SHP-1');
    component.costForm.setValue({ type: 'HANDLING', amount: -5, description: '' });

    component.addCost();

    expect(component.costForm.invalid).toBeTrue();
    expect(service.recordCost).not.toHaveBeenCalled();
  });
});
