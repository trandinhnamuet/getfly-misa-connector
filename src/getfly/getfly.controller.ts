import { Controller, Post, Req, Res, Body } from '@nestjs/common';
import * as util from 'util';
import { GetflyService } from './getfly.service';

@Controller('getfly')
export class GetflyController {
	constructor(private readonly getflyService: GetflyService) {}

	// Callback URL cho GetflyCRM
	@Post('callback')
	async getflyCallback(@Req() req, @Res() res, @Body() body: any) {
		// Log chi tiết object lồng nhau
		console.log('Received GetflyCRM callback:',
			util.inspect({
				headers: req.headers,
				body: body,
			}, { depth: null, colors: false })
		);
		// Gọi xử lý từ service nếu cần
		const result = await this.getflyService.handleCallback(body);
		// Trả về 200 OK cho GetflyCRM
		res.status(200).json({ message: 'Callback received', result });
	}
}
