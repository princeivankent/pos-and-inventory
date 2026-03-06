import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DashboardComponent } from './dashboard';
import { AuthService } from '../../core/services/auth.service';
import { StoreContextService } from '../../core/services/store-context.service';
import { SubscriptionService } from '../../core/services/subscription.service';

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let component: DashboardComponent;
  let controller: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: {
            currentUser: vi.fn(() => ({ full_name: 'Test Admin' })),
          },
        },
        {
          provide: StoreContextService,
          useValue: {
            isAdmin: vi.fn(() => true),
          },
        },
        {
          provide: SubscriptionService,
          useValue: {
            hasFeature: vi.fn(() => false),
            hasFeatureSignal: vi.fn(() => () => false),
          },
        },
      ],
    })
      .overrideComponent(DashboardComponent, {
        set: { template: '' },
      })
      .compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('loads always-available dashboard data and skips reports APIs when feature is locked', () => {
    fixture.detectChanges();

    controller.expectOne('/api/sales/daily').flush([]);
    controller.expectOne('/api/inventory/low-stock').flush([]);
    controller.expectOne('/api/products').flush([
      { id: 'p1', is_active: true },
      { id: 'p2', is_active: false },
    ]);

    controller.expectNone((req) => req.url.includes('/api/reports/'));

    expect(component.totalProducts()).toBe(1);
    expect(component.statsLoading()).toBe(false);
    expect(component.chartLoading()).toBe(false);
    expect(component.topSellingLoading()).toBe(false);
  });
});
