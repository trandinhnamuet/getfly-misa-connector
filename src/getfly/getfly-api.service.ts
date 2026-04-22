import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { GETFLY_CONFIG } from '../misa/config/misa.config';

@Injectable()
export class GetflyApiService {
  async getOrderById(orderId: string | number): Promise<any> {
    const url = `${GETFLY_CONFIG.base_url}/api/v6/sale_orders/${orderId}?fields=${GETFLY_CONFIG.order_fields}`;
    console.log(`🔍 Fetching Getfly order ${orderId}...`);
    const response = await axios.get(url, {
      headers: { 'X-API-KEY': GETFLY_CONFIG.api_key }
    });
    console.log(`✅ Getfly order ${orderId} fetched:`, JSON.stringify(response.data, null, 2));
    return response.data;
  }
}
