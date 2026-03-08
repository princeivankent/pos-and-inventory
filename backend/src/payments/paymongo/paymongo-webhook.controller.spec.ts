import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PaymongoWebhookController } from './paymongo-webhook.controller';
import { PaymentGateway } from '../payment-gateway.interface';
import { Payment } from '../../database/entities/payment.entity';
import { Invoice } from '../../database/entities/invoice.entity';
import { Subscription } from '../../database/entities/subscription.entity';

describe('PaymongoWebhookController', () => {
  let controller: PaymongoWebhookController;
  let paymentGateway: jest.Mocked<PaymentGateway>;

  beforeEach(() => {
    paymentGateway = {
      createPaymentIntent: jest.fn(),
      getPaymentIntent: jest.fn(),
      verifyWebhookSignature: jest.fn(),
      parseWebhookEvent: jest.fn(),
    };

    const paymentRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    } as unknown as Repository<Payment>;

    const invoiceRepository = {
      findOne: jest.fn(),
      update: jest.fn(),
    } as unknown as Repository<Invoice>;

    const subscriptionRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as unknown as Repository<Subscription>;

    controller = new PaymongoWebhookController(
      paymentGateway,
      paymentRepository,
      invoiceRepository,
      subscriptionRepository,
    );
  });

  it('verifies webhook signatures against the raw request body when available', async () => {
    const rawBody = Buffer.from('{"data":{"id":"evt_1"}}');
    const body = { data: { id: 'evt_1', ignored: true } };

    paymentGateway.verifyWebhookSignature.mockReturnValue(true);
    paymentGateway.parseWebhookEvent.mockReturnValue({
      type: 'unhandled.event',
      eventId: 'evt_1',
      data: {
        id: 'pay_1',
        attributes: {},
      },
    });

    await controller.handleWebhook(body, rawBody, 'sig_1');

    expect(paymentGateway.verifyWebhookSignature).toHaveBeenCalledWith(
      rawBody.toString('utf8'),
      'sig_1',
    );
  });

  it('rejects invalid webhook signatures', async () => {
    paymentGateway.verifyWebhookSignature.mockReturnValue(false);

    await expect(
      controller.handleWebhook({ data: { id: 'evt_1' } }, Buffer.from('{}'), 'bad_sig'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
