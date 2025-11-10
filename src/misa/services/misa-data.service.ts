import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { MISA_CONFIG, MISA_ENDPOINTS, DATA_FILES } from '../config/misa.config';
import { FileStorageService } from './file-storage.service';
import { MisaAuthService } from './misa-auth.service';

@Injectable()
export class MisaDataService {
  constructor(
    private readonly fileStorage: FileStorageService,
    private readonly authService: MisaAuthService
  ) {}

  // Lấy danh sách chi nhánh từ MISA (chỉ call 1 lần khi khởi động)
  async fetchBranches(): Promise<void> {
    try {
      // Kiểm tra file đã tồn tại chưa
      if (this.fileStorage.fileExists(DATA_FILES.branches)) {
        console.log('📁 Branches file already exists, skipping fetch');
        return;
      }

      console.log('🔄 Fetching branches from MISA...');
      const accessToken = await this.authService.getValidAccessToken();

      const payload = {
        data_type: 6,
        branch_id: null,
        skip: 0,
        take: 1000,
        app_id: MISA_CONFIG.app_id,
        last_sync_time: null
      };

      const response = await axios.post(MISA_ENDPOINTS.getDictionary, payload, {
        headers: { 'X-MISA-AccessToken': accessToken }
      });

      if (!response.data.Success) {
        throw new Error(`MISA Error: ${response.data.ErrorMessage}`);
      }

      const branches = JSON.parse(response.data.Data || '[]');
      
      // Lưu vào file
      const branchData = {
        branches,
        fetched_at: new Date().toISOString(),
        total: branches.length
      };

      this.fileStorage.writeJsonFile(DATA_FILES.branches, branchData);
      console.log(`✅ Fetched ${branches.length} branches successfully`);
      
    } catch (error) {
      console.error('❌ Error fetching branches:', error.message);
    }
  }

  // Lấy danh sách khách hàng từ MISA
  async fetchCustomers(): Promise<void> {
    try {
      console.log('🔄 Fetching customers from MISA...');
      const accessToken = await this.authService.getValidAccessToken();

      const payload = {
        data_type: 1,
        branch_id: null,
        skip: 0,
        take: 1000,
        app_id: MISA_CONFIG.app_id,
        last_sync_time: null
      };

      const response = await axios.post(MISA_ENDPOINTS.getDictionary, payload, {
        headers: { 'X-MISA-AccessToken': accessToken }
      });

      if (!response.data.Success) {
        throw new Error(`MISA Error: ${response.data.ErrorMessage}`);
      }

      const customersData = JSON.parse(response.data.Data || '[]');
      
      // Lọc và lưu chỉ các trường cần thiết để tiết kiệm bộ nhớ
      const customers = customersData
        .filter(customer => customer.dictionary_type === 1 && customer.is_customer)
        .map(customer => ({
          account_object_id: customer.account_object_id,
          account_object_code: customer.account_object_code,
          account_object_name: customer.account_object_name,
          address: customer.address || '',
          tel: customer.tel || null, // Trường quan trọng để mapping với GetflyCRM
          branch_id: customer.branch_id
        }));

      // Lưu vào file
      const customerData = {
        customers,
        fetched_at: new Date().toISOString(),
        total: customers.length
      };

      this.fileStorage.writeJsonFile(DATA_FILES.customers, customerData);
      console.log(`✅ Fetched ${customers.length} customers successfully`);
      
    } catch (error) {
      console.error('❌ Error fetching customers:', error.message);
    }
  }

  // Tìm khách hàng theo số điện thoại
  findCustomerByPhone(phone: string): any {
    const customerData = this.fileStorage.readJsonFile(DATA_FILES.customers);
    if (!customerData || !customerData.customers) return null;

    return customerData.customers.find(customer => 
      customer.tel && customer.tel.replace(/\D/g, '') === phone.replace(/\D/g, '')
    );
  }

  // Lấy thông tin chi nhánh
  getBranches(): any[] {
    const branchData = this.fileStorage.readJsonFile(DATA_FILES.branches);
    return branchData?.branches || [];
  }

  // Lấy danh sách khách hàng
  getCustomers(): any[] {
    const customerData = this.fileStorage.readJsonFile(DATA_FILES.customers);
    return customerData?.customers || [];
  }

  // Cron job: Update khách hàng mỗi ngày lúc 0h
  async updateCustomersDaily(): Promise<void> {
    try {
      await this.fetchCustomers();
      console.log('🔄 Customers updated successfully');
    } catch (error) {
      console.error('❌ Error updating customers:', error.message);
    }
  }
}