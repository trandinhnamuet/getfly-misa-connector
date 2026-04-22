import { Injectable } from '@nestjs/common';
import { MisaService } from '../misa/misa.service';
import { GetflyApiService } from './getfly-api.service';

@Injectable()
export class GetflyService {
  constructor(
    private readonly misaService: MisaService,
    private readonly getflyApiService: GetflyApiService
  ) {}

  async handleCallback(data: any): Promise<any> {
    console.log('📨 GetflyService.handleCallback:', data);

    if (data.event !== 'order.approved') {
      return { status: 'success', message: `Ignored event: ${data.event}` };
    }

    // Support both formats: data.data.data.order_id (old) and data.data.order_id (new)
    const innerData = data.data?.data?.order_id ? data.data.data : data.data;
    const orderId = innerData?.order_id;
    const orderCode = innerData?.order_code;

    if (!orderId) {
      console.warn('⚠️ order.approved event missing order_id');
      return { status: 'success', message: 'No order_id in callback' };
    }

    console.log(`✅ Order approved: ${orderCode} (id=${orderId}), fetching details...`);

    try {
      const getflyOrder = await this.getflyApiService.getOrderById(orderId);

      const misaResult = await this.misaService.createSalesVoucher(getflyOrder);
      console.log('📝 MISA voucher created:', misaResult);

      return { status: 'success', order_id: orderId, order_code: orderCode, misa_result: misaResult };
    } catch (error) {
      console.error(`❌ Error processing order ${orderId}:`, error.message);
      return { status: 'error', order_id: orderId, order_code: orderCode, error: error.message };
    }
  }
}
