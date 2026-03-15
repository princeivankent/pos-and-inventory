import { Injectable } from '@angular/core';

/**
 * Low-stock alert emails are now sent directly by the backend cron job (Resend API).
 * This service is kept as an empty stub to avoid breaking any residual imports.
 */
@Injectable({ providedIn: 'root' })
export class AlertsService {}
