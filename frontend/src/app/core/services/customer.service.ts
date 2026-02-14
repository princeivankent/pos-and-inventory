import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  Customer,
  CreateCustomerDto,
  UpdateCustomerDto,
  RecordPaymentDto,
  CreditStatement,
} from '../models/customer.model';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/customers`;

  getAll(search?: string) {
    const params: Record<string, string> = {};
    if (search?.trim()) params['search'] = search.trim();
    return this.http.get<Customer[]>(this.baseUrl, { params });
  }

  getOne(id: string) {
    return this.http.get<Customer>(`${this.baseUrl}/${id}`);
  }

  create(dto: CreateCustomerDto) {
    return this.http.post<Customer>(this.baseUrl, dto);
  }

  update(id: string, dto: UpdateCustomerDto) {
    return this.http.patch<Customer>(`${this.baseUrl}/${id}`, dto);
  }

  deactivate(id: string) {
    return this.http.delete<Customer>(`${this.baseUrl}/${id}`);
  }

  getStatement(id: string) {
    return this.http.get<CreditStatement>(`${this.baseUrl}/${id}/statement`);
  }

  recordPayment(id: string, dto: RecordPaymentDto) {
    return this.http.post<{ payment: any; customer: Customer }>(
      `${this.baseUrl}/${id}/payments`,
      dto
    );
  }
}
