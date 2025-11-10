# GetflyCRM - MISA Connector

## Mô tả
Hệ thống tự động tạo đề nghị sinh chứng từ bán hàng trên MISA AMIS Kế toán khi đơn hàng được duyệt trên GetflyCRM.

## Tính năng chính
1. **Tự động refresh access token** MISA mỗi 23h
2. **Đồng bộ danh mục** chi nhánh và khách hàng từ MISA
3. **Tự động tạo chứng từ** khi đơn hàng GetflyCRM được duyệt
4. **Lưu trữ file** thay vì database để tiết kiệm tài nguyên

## Cấu trúc thư mục
```
├── src/
│   ├── getfly/               # Module xử lý callback GetflyCRM
│   │   ├── getfly.controller.ts
│   │   ├── getfly.service.ts
│   │   └── getfly.module.ts
│   ├── misa/                 # Module xử lý MISA API
│   │   ├── config/
│   │   │   └── misa.config.ts # Cấu hình MISA
│   │   ├── services/
│   │   │   ├── file-storage.service.ts   # Lưu trữ file
│   │   │   ├── misa-auth.service.ts      # Xác thực MISA
│   │   │   └── misa-data.service.ts      # Đồng bộ dữ liệu
│   │   ├── misa.controller.ts
│   │   ├── misa.service.ts    # Service chính
│   │   └── misa.module.ts
│   └── app.module.ts
├── data/                     # Thư mục lưu file dữ liệu
│   ├── misa_token.txt       # Access token
│   ├── misa_branches.txt    # Danh sách chi nhánh
│   └── misa_customers.txt   # Danh sách khách hàng
└── package.json
```

## API Endpoints

### MISA Endpoints
- `POST /misa/callback` - Nhận callback từ MISA
- `POST /misa/sync-customers` - Đồng bộ khách hàng thủ công
- `POST /misa/sync-branches` - Đồng bộ chi nhánh thủ công
- `POST /misa/refresh-token` - Refresh token thủ công
- `GET /misa/customers` - Xem danh sách khách hàng
- `GET /misa/branches` - Xem danh sách chi nhánh
- `POST /misa/test-voucher` - Test tạo chứng từ

### GetflyCRM Endpoints
- `POST /getfly/callback` - Nhận callback từ GetflyCRM

## Cron Jobs
- **Token Refresh**: Mỗi 23h tự động refresh access token
- **Customer Update**: Mỗi ngày lúc 0h cập nhật danh sách khách hàng

## Quy trình hoạt động

1. **Khởi động ứng dụng**:
   - Lấy access token từ MISA
   - Đồng bộ danh sách chi nhánh (lần đầu)
   - Đồng bộ danh sách khách hàng

2. **Khi đơn hàng GetflyCRM được duyệt**:
   - Nhận callback `order.approved`
   - Tìm khách hàng tương ứng (theo số điện thoại)
   - Tạo payload chứng từ bán hàng
   - Gọi API MISA để tạo đề nghị sinh chứng từ

3. **Tự động hóa**:
   - Cron job refresh token mỗi 23h
   - Cron job cập nhật khách hàng mỗi ngày lúc 0h

## Cấu hình

Cập nhật file `src/misa/config/misa.config.ts`:

```typescript
export const MISA_CONFIG = {
  app_id: 'your_app_id',
  access_code: 'your_access_code',
  org_company_code: 'your_org_code',
  default_organization_unit_id: 'your_default_org_unit_id',
  // ... các cấu hình khác
};
```

## Chạy ứng dụng

```bash
# Development
npm run start:dev

# Production
npm run start:prod
```

## Test API

### Test đồng bộ khách hàng
```bash
curl -X POST http://localhost:3000/misa/sync-customers
```

### Test tạo chứng từ
```bash
curl -X POST http://localhost:3000/misa/test-voucher \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "123",
    "order_code": "DH0123",
    "total_amount": 1050000,
    "customer_phone": "0396818173"
  }'
```

## Log & Monitoring

Ứng dụng sẽ log các hoạt động chính:
- 🚀 Khởi tạo service
- 🔄 Đồng bộ dữ liệu
- ⏰ Chạy cron job
- 📝 Tạo chứng từ
- ❌ Lỗi xảy ra

## Lưu ý
- Server cần có quyền ghi file vào thư mục `./data/`
- Đảm bảo cấu hình callback URL đúng trong MISA và GetflyCRM
- Token MISA có thời hạn 24h, hệ thống tự động refresh mỗi 23h