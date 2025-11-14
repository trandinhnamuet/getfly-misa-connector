import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
  });
  
  // Tăng giới hạn body size để xử lý payload lớn từ GetflyCRM
  app.use('/getfly/callback', (req, res, next) => {
    // Tăng limit lên 1MB cho callback GetflyCRM
    const bodyParser = require('body-parser');
    const jsonParser = bodyParser.json({ limit: '1mb' });
    const urlencodedParser = bodyParser.urlencoded({ limit: '1mb', extended: true });
    
    if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
      jsonParser(req, res, next);
    } else if (req.headers['content-type'] && req.headers['content-type'].includes('application/x-www-form-urlencoded')) {
      urlencodedParser(req, res, next);
    } else {
      next();
    }
  });
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
