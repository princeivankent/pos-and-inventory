import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { environment } from '../../../environments/environment';
import { Sale } from '../../core/models/sale.model';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { PhpCurrencyPipe } from '../../shared/pipes/php-currency.pipe';
import { StatusBadge } from '../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-sale-detail',
  standalone: true,
  imports: [DatePipe, RouterLink, ButtonModule, PageHeader, PhpCurrencyPipe, StatusBadge],
  templateUrl: './sale-detail.html',
  styleUrls: ['./sale-detail.scss'],
})
export class SaleDetailComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  sale = signal<Sale | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.http.get<Sale>(`${environment.apiUrl}/sales/${id}`).subscribe(
        (s) => this.sale.set(s)
      );
    }
  }
}
