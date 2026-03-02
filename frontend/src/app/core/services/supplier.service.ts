import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  Supplier,
  CreateSupplierDto,
  UpdateSupplierDto,
} from '../models/supplier.model';

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/suppliers`;

  getAll(search?: string) {
    const params: Record<string, string> = {};
    if (search?.trim()) params['search'] = search.trim();
    return this.http.get<Supplier[]>(this.baseUrl, { params });
  }

  getOne(id: string) {
    return this.http.get<Supplier>(`${this.baseUrl}/${id}`);
  }

  create(dto: CreateSupplierDto) {
    return this.http.post<Supplier>(this.baseUrl, dto);
  }

  update(id: string, dto: UpdateSupplierDto) {
    return this.http.patch<Supplier>(`${this.baseUrl}/${id}`, dto);
  }

  deactivate(id: string) {
    return this.http.delete<Supplier>(`${this.baseUrl}/${id}`);
  }
}
