import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Page, ProfitCalculation, Shipment, ShipmentDetail } from '../models/shipment.model';

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

  /** Calculations are a resource of their own, not a sub-path of a shipment. */
  private readonly calculationsUrl = `${environment.apiUrl}/api/profit-calculations`;

  constructor(private http: HttpClient) {}

  /**
   * Shipments available to evaluate: a bounded, searchable slice. The backend
   * refuses to return the whole table, so the UI must narrow rather than filter
   * a list it already holds.
   */
  findShipments(search = '', limit = 20): Observable<Shipment[]> {

    const params: Record<string, string> = { limit: limit.toString() };

    if (search.trim()) {
      params['search'] = search.trim();
    }

    return this.http
      .get<ApiResponse<Shipment[]>>(this.baseUrl, { params })
      .pipe(map(res => res.data));
  }

  /** Everything recorded against one shipment. */
  findShipment(reference: string): Observable<ShipmentDetail> {
    return this.http
      .get<ApiResponse<ShipmentDetail>>(`${this.baseUrl}/${encodeURIComponent(reference)}`)
      .pipe(map(res => res.data));
  }

  createShipment(reference: string, customer: string): Observable<Shipment> {
    return this.http
      .post<ApiResponse<Shipment>>(this.baseUrl, { reference, customer })
      .pipe(map(res => res.data));
  }

  /** Records a customer payment or agent income; returns the updated shipment. */
  recordIncome(reference: string, type: string, amount: number, description: string): Observable<ShipmentDetail> {
    return this.http
      .post<ApiResponse<ShipmentDetail>>(
        `${this.baseUrl}/${encodeURIComponent(reference)}/incomes`, { type, amount, description })
      .pipe(map(res => res.data));
  }

  recordCost(reference: string, type: string, amount: number, description: string): Observable<ShipmentDetail> {
    return this.http
      .post<ApiResponse<ShipmentDetail>>(
        `${this.baseUrl}/${encodeURIComponent(reference)}/costs`, { type, amount, description })
      .pipe(map(res => res.data));
  }

  /**
   * Corrects an income already recorded. `version` is the one the line carried
   * when it was read; if someone corrected it since, the backend answers 409.
   */
  correctIncome(reference: string, id: number, amount: number, description: string, version: number): Observable<ShipmentDetail> {
    return this.http
      .put<ApiResponse<ShipmentDetail>>(
        `${this.baseUrl}/${encodeURIComponent(reference)}/incomes/${id}`, { amount, description, version })
      .pipe(map(res => res.data));
  }

  /** Corrects a cost already recorded; same rules as correctIncome. */
  correctCost(reference: string, id: number, amount: number, description: string, version: number): Observable<ShipmentDetail> {
    return this.http
      .put<ApiResponse<ShipmentDetail>>(
        `${this.baseUrl}/${encodeURIComponent(reference)}/costs/${id}`, { amount, description, version })
      .pipe(map(res => res.data));
  }

  /** Asks the backend to evaluate a shipment; the amounts come from its own records. */
  calculate(shipmentReference: string): Observable<ProfitCalculation> {
    return this.http
      .post<ApiResponse<ProfitCalculation>>(this.calculationsUrl, { shipmentReference })
      .pipe(map(res => res.data));
  }

  /**
   * Previously stored calculations. Paging, sorting and filtering all happen on
   * the server: only one page is ever in the browser, so doing any of them here
   * would quietly operate on a fraction of the data.
   */
  findCalculations(
    page = 0,
    size = 10,
    sort = 'calculatedAt',
    direction: 'asc' | 'desc' = 'desc',
    search = '',
  ): Observable<Page<ProfitCalculation>> {

    const params: Record<string, string> = {
      page: page.toString(),
      size: size.toString(),
      sort,
      direction,
    };

    if (search.trim()) {
      params['search'] = search.trim();
    }

    return this.http
      .get<ApiResponse<Page<ProfitCalculation>>>(this.calculationsUrl, { params })
      .pipe(map(res => res.data));
  }
}
