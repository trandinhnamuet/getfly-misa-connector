import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class MisaService {
  private readonly appId = '0e0a14cf-9e4b-4af9-875b-c490f34a581b'; // Thay bằng app_id thật khi có

  async handleCallback(param: any): Promise<any> {
    const result: any = { Success: true, ErrorMessage: '' };
    try {
      // BỎ QUA validate chữ ký, nếu cần thì mở lại đoạn dưới:
      // const signature = this.generatorSHA256HMAC(param.data, this.appId);
      // if (signature !== param.signature) {
      //   result.Success = false;
      //   result.ErrorCode = 'InvalidParam';
      //   result.ErrorMessage = 'Signature invalid';
      // } else {
      //   // Xử lý dữ liệu callback
      // }

      // Xử lý dữ liệu callback (bỏ qua validate)
      console.log('MISA callback payload:', param);
    } catch (ex: any) {
      result.Success = false;
      result.ErrorCode = 'Exception';
      result.ErrorMessage = ex.message;
      // Log payload cả khi lỗi
      console.log('MISA callback payload (error):', param);
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
