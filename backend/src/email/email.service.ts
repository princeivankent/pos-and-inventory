import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;
  private from = process.env.EMAIL_FROM ?? 'POS System <noreply@resend.dev>';

  async sendPasswordResetEmail(toEmail: string, toName: string, resetLink: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Reset Your Password</title>
        </head>
        <body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
            <tr>
              <td align="center">
                <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                  <tr>
                    <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">
                      <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">Password Reset</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:40px;">
                      <p style="margin:0 0 16px;color:#374151;font-size:16px;">Hi ${toName},</p>
                      <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
                        We received a request to reset your password for your POS &amp; Inventory account.
                        Click the button below to create a new password. This link expires in <strong>1 hour</strong>.
                      </p>
                      <div style="text-align:center;margin:32px 0;">
                        <a href="${resetLink}"
                           style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;">
                          Reset Password
                        </a>
                      </div>
                      <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">
                        Or paste this link in your browser:
                      </p>
                      <p style="margin:0 0 24px;word-break:break-all;">
                        <a href="${resetLink}" style="color:#6366f1;font-size:13px;">${resetLink}</a>
                      </p>
                      <p style="margin:0;color:#9ca3af;font-size:13px;">
                        If you did not request a password reset, you can safely ignore this email.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:24px 40px;border-top:1px solid #f3f4f6;text-align:center;">
                      <p style="margin:0;color:#9ca3af;font-size:12px;">
                        &copy; ${new Date().getFullYear()} POS &amp; Inventory System. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    if (!this.resend) {
      this.logger.warn(`RESEND_API_KEY not configured — skipping password reset email to ${toEmail}`);
      return;
    }
    try {
      await this.resend.emails.send({
        from: this.from,
        to: toEmail,
        subject: 'Reset Your Password',
        html,
      });
      this.logger.log(`Password reset email sent to ${toEmail}`);
    } catch (err) {
      this.logger.error(`Failed to send password reset email to ${toEmail}`, err);
      throw err;
    }
  }

  async sendLowStockAlertEmail(
    toEmail: string,
    storeName: string,
    products: Array<{
      name: string;
      sku: string;
      currentStock: number;
      reorderLevel: number;
      alertType: string;
    }>,
  ): Promise<void> {
    const productRows = products
      .map(
        (p) => `
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;color:#374151;font-size:14px;">${p.name}</td>
          <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;font-family:monospace;">${p.sku || '—'}</td>
          <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;text-align:center;">
            <span style="display:inline-block;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:600;
              background:${p.alertType === 'out_of_stock' ? '#fee2e2' : '#fef3c7'};
              color:${p.alertType === 'out_of_stock' ? '#dc2626' : '#d97706'};">
              ${p.currentStock} / ${p.reorderLevel}
            </span>
          </td>
          <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;text-align:center;">
            <span style="display:inline-block;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:600;
              background:${p.alertType === 'out_of_stock' ? '#fee2e2' : '#fef3c7'};
              color:${p.alertType === 'out_of_stock' ? '#dc2626' : '#d97706'};">
              ${p.alertType === 'out_of_stock' ? 'Out of Stock' : 'Low Stock'}
            </span>
          </td>
        </tr>`,
      )
      .join('');

    const alertDate = new Date().toLocaleDateString('en-PH', { dateStyle: 'long' });

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Low Stock Alert</title>
        </head>
        <body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                  <tr>
                    <td style="background:linear-gradient(135deg,#f59e0b,#ef4444);padding:32px 40px;text-align:center;">
                      <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">⚠️ Low Stock Alert</h1>
                      <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">${storeName} · ${alertDate}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:32px 40px 0;">
                      <p style="margin:0 0 8px;color:#374151;font-size:15px;">
                        <strong>${products.length} product${products.length !== 1 ? 's' : ''}</strong> need${products.length === 1 ? 's' : ''} your attention:
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:16px 40px 32px;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                        <thead>
                          <tr style="background:#f9fafb;">
                            <th style="padding:10px 16px;text-align:left;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Product</th>
                            <th style="padding:10px 16px;text-align:left;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">SKU</th>
                            <th style="padding:10px 16px;text-align:center;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Stock / Reorder</th>
                            <th style="padding:10px 16px;text-align:center;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Status</th>
                          </tr>
                        </thead>
                        <tbody>${productRows}</tbody>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:24px 40px;border-top:1px solid #f3f4f6;text-align:center;">
                      <p style="margin:0;color:#9ca3af;font-size:12px;">
                        &copy; ${new Date().getFullYear()} POS &amp; Inventory System. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    if (!this.resend) {
      this.logger.warn(`RESEND_API_KEY not configured — skipping low-stock alert email to ${toEmail}`);
      return;
    }
    try {
      await this.resend.emails.send({
        from: this.from,
        to: toEmail,
        subject: `⚠️ Low Stock Alert — ${storeName} (${products.length} item${products.length !== 1 ? 's' : ''})`,
        html,
      });
      this.logger.log(`Low-stock alert email sent to ${toEmail} for store ${storeName}`);
    } catch (err) {
      this.logger.error(`Failed to send low-stock alert email to ${toEmail}`, err);
      throw err;
    }
  }
}
