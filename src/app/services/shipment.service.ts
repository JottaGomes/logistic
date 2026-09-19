import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Page, ProfitCalculation, Shipment } from '../models/shipment.model';

interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T;
}

/**
 * The single point of contact with the backend for this use case. Components
 * depend on this interface rather than on HttpClient, so the transport can
 * change without touching them.
 */
@Injectable({ providedIn: 'root' })
export class ShipmentService {

  private readonly baseUrl = `${environment.apiUrl}/api/shipments`;

  constructor(private http: HttpClient) {}

  /** The shipments available to evaluate. */
  findShipments(): Observable<Shipment[]> {
    return this.http.get<ApiResponse<Shipment[]>>(this.baseUrl).pipe(map(res => res.data));
  }

  /** Asks the backend to evaluate a shipment; the amounts come from its own records. */
  calculate(shipmentReference: string): Observable<ProfitCalculation> {
    return this.http
      .post<ApiResponse<ProfitCalculation>>(`${this.baseUrl}/calculate`, { shipmentReference })
      .pipe(map(res => res.data));
  }

  /** Previously stored calculations, most recent first. */
  findCalculations(page = 0, size = 10): Observable<Page<ProfitCalculation>> {
    return this.http
      .get<ApiResponse<Page<ProfitCalculation>>>(`${this.baseUrl}/calculations`, {
        params: { page: page.toString(), size: size.toString() },
      })
      .pipe(map(res => res.data));
  }
}
