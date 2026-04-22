import { Injectable, OnModuleInit } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';
import { Cron, CronExpression } from '@nestjs/schedule';
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

  async onModuleInit() {
    console.log('🚀 MISA Service initialized');
    await this.dataService.fetchBranches();
    await this.dataService.fetchCustomers();
    await this.dataService.fetchInventoryItems();
    await this.authService.getValidAccessToken();
  }

  @Cron('0 0 */23 * * *')
  async handleTokenRefresh() {
    console.log('⏰ Running token refresh cron job...');
    await this.authService.refreshTokenDaily();
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCustomerUpdate() {
    console.log('⏰ Running customer update cron job...');
    await this.dataService.updateCustomersDaily();
  }

  // Tạo đề nghị sinh chứng từ bán hàng từ dữ liệu đơn hàng Getfly
  async createSalesVoucher(getflyOrder: any): Promise<any> {
    try {
      console.log('📝 Creating sales voucher for Getfly order:', getflyOrder.order_code || getflyOrder.id);

      const accessToken = await this.authService.getValidAccessToken();
      const orderDate = getflyOrder.order_date || new Date().toISOString().split('T')[0];

      // --- Tìm khách hàng trong MISA ---
      let customer: any = null;
      const phone = getflyOrder.contact_phone || getflyOrder.account_phone;
      const email = getflyOrder.contact_email || getflyOrder.account_email;
      const name = getflyOrder.contact_name || getflyOrder.account_code;

      if (phone) customer = this.dataService.findCustomerByPhone(phone);
      if (!customer && email) customer = this.dataService.findCustomerByEmail(email);
      if (!customer && name) customer = this.dataService.findCustomerByName(name);

      let accountObjectId: string;
      let accountObjectName: string;
      let newCustomerEntry: any = null;

      if (customer) {
        accountObjectId = customer.account_object_id;
        accountObjectName = customer.account_object_name;
        console.log(`👤 Matched MISA customer: ${accountObjectName} (${accountObjectId})`);
      } else {
        // Tạo mới khách hàng cùng với voucher
        accountObjectId = crypto.randomUUID();
        accountObjectName = name || 'Khách hàng GetflyCRM';
        newCustomerEntry = {
          dictionary_type: 1,
          account_object_id: accountObjectId,
          account_object_code: `GF_${getflyOrder.account_id || Date.now()}`,
          account_object_name: accountObjectName,
          tel: phone || '',
          email: email || '',
          account_object_address: getflyOrder.account_address || '',
          is_customer: true,
          is_vendor: false,
          state: 1
        };
        console.log(`👤 No matching customer found, will create new: ${accountObjectName}`);
      }

      // --- Map chi tiết sản phẩm ---
      const orderDetails: any[] = getflyOrder.order_details || [];
      const details = orderDetails.map((item: any) => {
        const inventoryItem = this.dataService.findInventoryItemByName(item.product_name || item.product_code);
        const qty = Number(item.quantity) || 1;
        const amount = Number(item.amount) || 0;
        const unitPrice = qty > 0 ? amount / qty : amount;
        const vatRate = (Number(item.vat) || 0) / 100;
        const vatAmount = Number(item.vat_amount) || 0;

        if (!inventoryItem) {
          console.warn(`⚠️ No MISA inventory match for: "${item.product_name || item.product_code}", using default`);
        }

        return {
          inventory_item_id: inventoryItem?.inventory_item_id || MISA_CONFIG.default_inventory_item_id,
          inventory_item_name: item.product_name || item.product_code || 'Hàng hóa',
          quantity: qty,
          unit_id: inventoryItem?.unit_id || MISA_CONFIG.default_unit_id,
          unit_name: item.unit_name || inventoryItem?.unit_name || 'Cái',
          unit_price_oc: unitPrice,
          unit_price: unitPrice,
          amount_oc: amount,
          amount: amount,
          vat_rate: vatRate,
          vat_amount_oc: vatAmount,
          vat_amount: vatAmount,
          account_id: '131',
          stock_id: inventoryItem?.stock_id || MISA_CONFIG.default_stock_id
        };
      });

      if (details.length === 0) {
        const fallbackAmount = Number(getflyOrder.real_amount) || 0;
        details.push({
          inventory_item_id: MISA_CONFIG.default_inventory_item_id,
          inventory_item_name: `Hàng hóa đơn hàng ${getflyOrder.order_code || getflyOrder.id}`,
          quantity: 1,
          unit_id: MISA_CONFIG.default_unit_id,
          unit_name: 'Cái',
          unit_price_oc: fallbackAmount,
          unit_price: fallbackAmount,
          amount_oc: fallbackAmount,
          amount: fallbackAmount,
          vat_rate: 0,
          vat_amount_oc: 0,
          vat_amount: 0,
          account_id: '131',
          stock_id: MISA_CONFIG.default_stock_id
        });
      }

      const totalVatAmount = Number(getflyOrder.vat_amount) || 0;
      const totalAmount = (Number(getflyOrder.real_amount) || 0) + totalVatAmount;

      const payload: any = {
        app_id: MISA_CONFIG.app_id,
        org_company_code: MISA_CONFIG.org_company_code,
        voucher: [
          {
            voucher_type: 13,
            org_refid: `GF_${getflyOrder.id}_${Date.now()}`,
            org_refno: getflyOrder.order_code || `GF-${getflyOrder.id}`,
            org_reftype: 3535,
            org_reftype_name: 'Phiếu bán hàng',
            refdate: orderDate,
            posted_date: orderDate,
            journal_memo: `Đề nghị sinh chứng từ bán hàng từ GetflyCRM - Đơn hàng ${getflyOrder.order_code || getflyOrder.id}`,
            account_object_id: accountObjectId,
            account_object_name: accountObjectName,
            exchange_rate: 1.0,
            total_amount_oc: totalAmount,
            total_amount: totalAmount,
            total_vat_amount_oc: totalVatAmount,
            total_vat_amount: totalVatAmount,
            branch_id: MISA_CONFIG.default_branch_id,
            organization_unit_id: MISA_CONFIG.default_organization_unit_id,
            detail: details
          }
        ]
      };

      if (newCustomerEntry) {
        payload.dictionary = [newCustomerEntry];
      }

      console.log('📤 Sending voucher to MISA:', JSON.stringify(payload, null, 2));

      const response = await axios.post(MISA_ENDPOINTS.save, payload, {
        headers: { 'X-MISA-AccessToken': accessToken }
      });

      console.log('📥 MISA Response:', response.data);

      if (response.data.ErrorCode === 'ExpiredToken') {
        console.log('🔄 Token expired, refreshing and retrying...');
        await this.authService.connectToMisa();
        const newToken = await this.authService.getValidAccessToken();
        const retryResponse = await axios.post(MISA_ENDPOINTS.save, payload, {
          headers: { 'X-MISA-AccessToken': newToken }
        });
        return retryResponse.data;
      }

      return response.data;
    } catch (error) {
      console.error('❌ Error creating sales voucher:', error.message);
      if (error.response?.status === 500) {
        console.log('🔄 Possible invalid token, refreshing...');
        await this.authService.connectToMisa();
        throw new Error('Token refreshed, please retry');
      }
      throw error;
    }
  }

  async handleCallback(param: any): Promise<any> {
    const result: any = { Success: true, ErrorMessage: '' };
    try {
      console.log('📨 MISA callback payload:', param);
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
