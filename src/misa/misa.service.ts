import { Injectable, OnModuleInit } from '@nestjs/common';
import axios from 'axios';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as crypto from 'crypto';
import { MISA_CONFIG, MISA_ENDPOINTS } from './config/misa.config';
import { FileStorageService } from './services/file-storage.service';
import { MisaAuthService } from './services/misa-auth.service';
import { MisaDataService } from './services/misa-data.service';

@Injectable()
export class MisaService implements OnModuleInit {
  constructor(
    private readonly fileStorage: FileStorageService,
    private readonly authService: MisaAuthService,
    private readonly dataService: MisaDataService
  ) {}

  // Khởi tạo khi module start
  async onModuleInit() {
    console.log('🚀 MISA Service initialized');
    
    // Fetch branches (chỉ lần đầu)
    await this.dataService.fetchBranches();
    
    // Fetch customers lần đầu
    await this.dataService.fetchCustomers();
    
    // Đảm bảo có access token
    await this.authService.getValidAccessToken();
  }

  // Cron job: Refresh token mỗi 23h
  @Cron('0 0 */23 * * *') // Mỗi 23h
  async handleTokenRefresh() {
    console.log('⏰ Running token refresh cron job...');
    await this.authService.refreshTokenDaily();
  }

  // Cron job: Update customers mỗi ngày lúc 0h
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT) // 0h hàng ngày
  async handleCustomerUpdate() {
    console.log('⏰ Running customer update cron job...');
    await this.dataService.updateCustomersDaily();
  }

  // Tạo đề nghị sinh chứng từ bán hàng
  async createSalesVoucher(orderData: any): Promise<any> {
    try {
      console.log('📝 Creating sales voucher for order:', orderData);
      
      const accessToken = await this.authService.getValidAccessToken();
      const today = new Date().toISOString().split('T')[0];
      
      // Tìm khách hàng mặc định hoặc theo phone (nếu có)
      let customer: any = null;
      if (orderData.customer_phone) {
        customer = this.dataService.findCustomerByPhone(orderData.customer_phone);
      }

      const payload = {
        app_id: MISA_CONFIG.app_id,
        org_company_code: MISA_CONFIG.org_company_code,
        voucher: [
          {
            voucher_type: 13,
            org_refid: `GF_${orderData.order_code || orderData.order_id}_${Date.now()}`,
            org_refno: orderData.order_code || `GF-${orderData.order_id}`,
            org_reftype: 3535,
            org_reftype_name: 'Phiếu bán hàng',
            refdate: today,
            posted_date: today,
            journal_memo: `Đề nghị sinh chứng từ bán hàng từ GetflyCRM - Đơn hàng ${orderData.order_code || orderData.order_id}`,
            account_object_id: customer?.account_object_id || 'eefe1058-f377-4091-9c57-a9be474ebf50',
            account_object_name: customer?.account_object_name || 'Khách hàng GetflyCRM',
            exchange_rate: 1.0,
            total_amount_oc: orderData.total_amount || 1050000.0,
            total_amount: orderData.total_amount || 1050000.0,
            total_vat_amount_oc: (orderData.total_amount || 1050000.0) * 0.05,
            total_vat_amount: (orderData.total_amount || 1050000.0) * 0.05,
            branch_id: MISA_CONFIG.default_branch_id,
            detail: [
              {
                inventory_item_id: MISA_CONFIG.default_inventory_item_id,
                inventory_item_name: `Sản phẩm đơn hàng ${orderData.order_code || orderData.order_id}`,
                quantity: orderData.quantity || 1.0,
                unit_id: MISA_CONFIG.default_unit_id,
                unit_name: 'Cái',
                unit_price_oc: orderData.unit_price || 1000000.0,
                unit_price: orderData.unit_price || 1000000.0,
                amount_oc: orderData.total_amount || 1000000.0,
                amount: orderData.total_amount || 1000000.0,
                vat_rate: 0.05,
                vat_amount_oc: (orderData.total_amount || 1000000.0) * 0.05,
                vat_amount: (orderData.total_amount || 1000000.0) * 0.05,
                account_id: '131',
                stock_id: MISA_CONFIG.default_stock_id
              }
            ]
          }
        ]
      };

      console.log('📤 Sending voucher to MISA:', JSON.stringify(payload, null, 2));

      const response = await axios.post(MISA_ENDPOINTS.save, payload, {
        headers: { 'X-MISA-AccessToken': accessToken }
      });

      console.log('📥 MISA Response:', response.data);

      // Xử lý response lỗi token hết hạn
      if (response.data.ErrorCode === 'ExpiredToken') {
        console.log('🔄 Token expired, refreshing and retrying...');
        await this.authService.connectToMisa();
        const newToken = await this.authService.getValidAccessToken();
        
        // Retry với token mới
        const retryResponse = await axios.post(MISA_ENDPOINTS.save, payload, {
          headers: { 'X-MISA-AccessToken': newToken }
        });
        
        return retryResponse.data;
      }

      return response.data;
      
    } catch (error) {
      console.error('❌ Error creating sales voucher:', error.message);
      
      // Xử lý lỗi 500 (token không hợp lệ)
      if (error.response?.status === 500) {
        console.log('🔄 Possible invalid token, refreshing...');
        await this.authService.connectToMisa();
        throw new Error('Token refreshed, please retry');
      }
      
      throw error;
    }
  }

  // Xử lý callback từ MISA
  async handleCallback(param: any): Promise<any> {
    const result: any = { Success: true, ErrorMessage: '' };
    try {
      console.log('📨 MISA callback payload:', param);
      
      // Có thể xử lý logic khi nhận callback từ MISA
      // Ví dụ: cập nhật trạng thái đơn hàng, gửi thông báo...
      
    } catch (ex: any) {
      result.Success = false;
      result.ErrorCode = 'Exception';
      result.ErrorMessage = ex.message;
      console.log('❌ MISA callback payload (error):', param);
    }
    return result;
  }

  private generatorSHA256HMAC(input: string, key: string): string {
    if (!input) input = '';
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(input, 'utf8');
    return hmac.digest('hex');
  }
}
