import { Injectable } from '@nestjs/common';
import { MisaService } from '../misa/misa.service';

@Injectable()
export class GetflyService {
	constructor(private readonly misaService: MisaService) {}

	// Xử lý dữ liệu callback từ GetflyCRM
	async handleCallback(data: any): Promise<any> {
		console.log('📨 GetflyService.handleCallback:', data);
		
		// Kiểm tra nếu là event duyệt đơn hàng
		if (data.event === 'order.approved' && data.data?.data) {
			const orderData = data.data.data;
			console.log('✅ Order approved - creating MISA voucher:', orderData);
			
			try {
				// Gọi API tạo chứng từ MISA
				const misaResult = await this.misaService.createSalesVoucher({
					order_id: orderData.order_id,
					order_code: orderData.order_code,
					// Có thể thêm các trường khác từ GetflyCRM nếu có
					total_amount: 1050000, // Tạm thời fix cứng
					quantity: 1,
					unit_price: 1000000
				});
				
				console.log('📝 MISA voucher created:', misaResult);
				
				return { 
					status: 'success', 
					received: data,
					misa_result: misaResult
				};
				
			} catch (error) {
				console.error('❌ Error creating MISA voucher:', error.message);
				
				return { 
					status: 'success', 
					received: data,
					misa_error: error.message
				};
			}
		}
		
		// Trả về kết quả xử lý cho các event khác
		return { status: 'success', received: data };
	}
}
