import { Injectable } from '@nestjs/common';

@Injectable()
export class GetflyService {
	// Xử lý dữ liệu callback từ GetflyCRM
	async handleCallback(data: any): Promise<any> {
		// Tùy ý xử lý dữ liệu, ví dụ chỉ log ra
		console.log('GetflyService.handleCallback:', data);
		// Trả về kết quả xử lý (có thể là dữ liệu đã lưu, trạng thái, v.v.)
		return { status: 'success', received: data };
	}
}
