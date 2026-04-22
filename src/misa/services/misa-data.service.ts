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

  async fetchBranches(): Promise<void> {
    try {
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
      this.fileStorage.writeJsonFile(DATA_FILES.branches, {
        branches,
        fetched_at: new Date().toISOString(),
        total: branches.length
      });
      console.log(`✅ Fetched ${branches.length} branches successfully`);
    } catch (error) {
      console.error('❌ Error fetching branches:', error.message);
    }
  }

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
      const customers = customersData
        .filter(c => c.dictionary_type === 1 && c.is_customer)
        .map(c => ({
          account_object_id: c.account_object_id,
          account_object_code: c.account_object_code,
          account_object_name: c.account_object_name,
          address: c.address || '',
          tel: c.tel || null,
          email: c.email || null,
          branch_id: c.branch_id
        }));

      this.fileStorage.writeJsonFile(DATA_FILES.customers, {
        customers,
        fetched_at: new Date().toISOString(),
        total: customers.length
      });
      console.log(`✅ Fetched ${customers.length} customers successfully`);
    } catch (error) {
      console.error('❌ Error fetching customers:', error.message);
    }
  }

  async fetchInventoryItems(): Promise<void> {
    try {
      console.log('🔄 Fetching inventory items from MISA...');
      const accessToken = await this.authService.getValidAccessToken();

      const payload = {
        data_type: 2,
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

      const itemsData = JSON.parse(response.data.Data || '[]');
      const items = itemsData.map(item => ({
        inventory_item_id: item.inventory_item_id,
        inventory_item_code: item.inventory_item_code || '',
        inventory_item_name: item.inventory_item_name || '',
        unit_id: item.unit_id || MISA_CONFIG.default_unit_id,
        unit_name: item.unit_name || 'Cái',
        stock_id: item.default_stock_id || MISA_CONFIG.default_stock_id
      }));

      this.fileStorage.writeJsonFile(DATA_FILES.inventory, {
        items,
        fetched_at: new Date().toISOString(),
        total: items.length
      });
      console.log(`✅ Fetched ${items.length} inventory items successfully`);
    } catch (error) {
      console.error('❌ Error fetching inventory items:', error.message);
    }
  }

  findCustomerByPhone(phone: string): any {
    const data = this.fileStorage.readJsonFile(DATA_FILES.customers);
    if (!data?.customers) return null;
    const normalized = phone.replace(/\D/g, '');
    return data.customers.find(c => c.tel && c.tel.replace(/\D/g, '') === normalized) || null;
  }

  findCustomerByEmail(email: string): any {
    if (!email) return null;
    const data = this.fileStorage.readJsonFile(DATA_FILES.customers);
    if (!data?.customers) return null;
    const normalized = email.trim().toLowerCase();
    return data.customers.find(c => c.email && c.email.trim().toLowerCase() === normalized) || null;
  }

  findCustomerByName(name: string): any {
    if (!name) return null;
    const data = this.fileStorage.readJsonFile(DATA_FILES.customers);
    if (!data?.customers) return null;
    const normalized = this.normalizeName(name);
    return (
      data.customers.find(c => this.normalizeName(c.account_object_name) === normalized) ||
      data.customers.find(c => {
        const misaName = this.normalizeName(c.account_object_name);
        return misaName.includes(normalized) || normalized.includes(misaName);
      }) ||
      null
    );
  }

  findInventoryItemByName(name: string): any {
    if (!name) return null;
    const data = this.fileStorage.readJsonFile(DATA_FILES.inventory);
    if (!data?.items) return null;
    const normalized = this.normalizeName(name);
    return (
      data.items.find(item => this.normalizeName(item.inventory_item_name) === normalized) ||
      data.items.find(item => this.normalizeName(item.inventory_item_code) === normalized) ||
      data.items.find(item => {
        const itemName = this.normalizeName(item.inventory_item_name);
        return itemName.includes(normalized) || normalized.includes(itemName);
      }) ||
      null
    );
  }

  getBranches(): any[] {
    return this.fileStorage.readJsonFile(DATA_FILES.branches)?.branches || [];
  }

  getCustomers(): any[] {
    return this.fileStorage.readJsonFile(DATA_FILES.customers)?.customers || [];
  }

  async updateCustomersDaily(): Promise<void> {
    try {
      await this.fetchCustomers();
      console.log('🔄 Customers updated successfully');
    } catch (error) {
      console.error('❌ Error updating customers:', error.message);
    }
  }

  private normalizeName(name: string): string {
    if (!name) return '';
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
