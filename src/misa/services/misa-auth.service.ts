import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { MISA_CONFIG, MISA_ENDPOINTS, DATA_FILES } from '../config/misa.config';
import { FileStorageService } from './file-storage.service';

@Injectable()
export class MisaAuthService {
  constructor(private readonly fileStorage: FileStorageService) {}

  // Lấy access token từ file
  getAccessToken(): string | null {
    const tokenData = this.fileStorage.readJsonFile(DATA_FILES.token);
    if (tokenData && tokenData.access_token && new Date(tokenData.expired_time) > new Date()) {
      return tokenData.access_token;
    }
    return null;
  }

  // Kết nối MISA để lấy access token
  async connectToMisa(): Promise<string> {
    try {
      console.log('🔄 Connecting to MISA...');
      
      const payload = {
        app_id: MISA_CONFIG.app_id,
        access_code: MISA_CONFIG.access_code,
        org_company_code: MISA_CONFIG.org_company_code
      };

      const response = await axios.post(MISA_ENDPOINTS.connect, payload);
      
      if (!response.data.Success) {
        throw new Error(`MISA Error: ${response.data.ErrorMessage}`);
      }

      const tokenInfo = JSON.parse(response.data.Data);
      
      // Lưu token vào file
      const tokenData = {
        access_token: tokenInfo.access_token,
        expired_time: tokenInfo.expired_time,
        tenant_code: tokenInfo.tenant_code,
        app_name: tokenInfo.app_name,
        updated_at: new Date().toISOString()
      };

      this.fileStorage.writeJsonFile(DATA_FILES.token, tokenData);
      
      console.log('✅ Connected to MISA successfully');
      return tokenInfo.access_token;
      
    } catch (error) {
      console.error('❌ Error connecting to MISA:', error.message);
      throw error;
    }
  }

  // Lấy access token hợp lệ (kiểm tra hạn, nếu hết thì kết nối lại)
  async getValidAccessToken(): Promise<string> {
    let token = this.getAccessToken();
    
    if (!token) {
      console.log('🔄 Token not found or expired, reconnecting...');
      token = await this.connectToMisa();
    }
    
    return token;
  }

  // Cron job: Refresh token mỗi 23h
  async refreshTokenDaily(): Promise<void> {
    try {
      await this.connectToMisa();
      console.log('🔄 Token refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing token:', error.message);
    }
  }
}