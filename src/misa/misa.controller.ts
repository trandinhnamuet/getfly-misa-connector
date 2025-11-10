import { Controller, Post, Body, Get } from '@nestjs/common';
import { MisaService } from './misa.service';
import { MisaDataService } from './services/misa-data.service';
import { MisaAuthService } from './services/misa-auth.service';

@Controller('misa')
export class MisaController {
  constructor(
    private readonly misaService: MisaService,
    private readonly dataService: MisaDataService,
    private readonly authService: MisaAuthService
  ) {}

  @Post('callback')
  async misaCallback(@Body() body: any) {
    // Xử lý callback từ MISA
    const output = await this.misaService.handleCallback(body);
    return output;
  }

  // Endpoint để manual trigger sync customers
  @Post('sync-customers')
  async syncCustomers() {
    try {
      await this.dataService.fetchCustomers();
      return { success: true, message: 'Customers synced successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Endpoint để manual trigger sync branches
  @Post('sync-branches')
  async syncBranches() {
    try {
      await this.dataService.fetchBranches();
      return { success: true, message: 'Branches synced successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Endpoint để manual trigger refresh token
  @Post('refresh-token')
  async refreshToken() {
    try {
      const token = await this.authService.connectToMisa();
      return { success: true, message: 'Token refreshed', token: token.substring(0, 20) + '...' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Lấy danh sách khách hàng
  @Get('customers')
  async getCustomers() {
    const customers = this.dataService.getCustomers();
    return { success: true, data: customers, total: customers.length };
  }

  // Lấy danh sách chi nhánh
  @Get('branches')
  async getBranches() {
    const branches = this.dataService.getBranches();
    return { success: true, data: branches, total: branches.length };
  }

  // Test tạo voucher
  @Post('test-voucher')
  async testCreateVoucher(@Body() orderData: any) {
    try {
      const result = await this.misaService.createSalesVoucher(orderData);
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
