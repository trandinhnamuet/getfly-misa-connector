import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileStorageService {
  private ensureDirectoryExists(filePath: string): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Đọc file JSON
  readJsonFile(filePath: string): any {
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return null;
    }
  }

  // Ghi file JSON
  writeJsonFile(filePath: string, data: any): void {
    try {
      this.ensureDirectoryExists(filePath);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`Data saved to ${filePath}`);
    } catch (error) {
      console.error(`Error writing file ${filePath}:`, error);
    }
  }

  // Kiểm tra file tồn tại
  fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }
}