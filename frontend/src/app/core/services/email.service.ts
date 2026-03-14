import { Injectable } from '@angular/core';
import emailjs from '@emailjs/browser';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EmailService {
  async sendPasswordResetEmail(toEmail: string, toName: string, resetLink: string): Promise<void> {
    const { serviceId, forgotPasswordTemplateId, publicKey } = environment.emailjs;

    await emailjs.send(
      serviceId,
      forgotPasswordTemplateId,
      {
        to_name: toName,
        to_email: toEmail,
        reset_link: resetLink,
      },
      publicKey,
    );
  }
}
