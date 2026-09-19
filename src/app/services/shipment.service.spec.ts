import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ShipmentService } from './shipment.service';
import { environment } from '../../environments/environment';

describe('ShipmentService', () => {

  let service: ShipmentService;
  let http: HttpTestingController;

  const baseUrl = `${environment.apiUrl}/api/shipments`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ShipmentService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ShipmentService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('unwraps the envelope when listing shipments, and always bounds the request', () => {
    let result: unknown;
    service.findShipments().subscribe(shipments => (result = shipments));

    const request = http.expectOne(r => r.url === baseUrl);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('limit')).toBe('20');
    expect(request.request.params.has('search')).toBeFalse();
    request.flush({ success: true, message: null, data: [{ id: 1, reference: 'SHP-1', customer: 'ACME' }] });

    expect(result).toEqual([{ id: 1, reference: 'SHP-1', customer: 'ACME' }]);
  });

  it('sends the search term when narrowing the shipment list', () => {
    service.findShipments('  sonae  ', 5).subscribe();

    const request = http.expectOne(r => r.url === baseUrl);
    expect(request.request.params.get('search')).toBe('sonae');
    expect(request.request.params.get('limit')).toBe('5');
    request.flush({ success: true, message: null, data: [] });
  });

  it('posts only the shipment reference to calculate', () => {
    service.calculate('SHP-1').subscribe();

    const request = http.expectOne(`${baseUrl}/calculate`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ shipmentReference: 'SHP-1' });
    request.flush({ success: true, message: null, data: { id: 1, profitOrLoss: 100 } });
  });

  it('passes pagination through as query parameters', () => {
    service.findCalculations(2, 25).subscribe();

    const request = http.expectOne(r => r.url === `${baseUrl}/calculations`);
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('size')).toBe('25');
    request.flush({ success: true, message: null, data: { content: [], totalElements: 0, number: 0, size: 25 } });
  });
});
