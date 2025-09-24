// File: local-kv.ts
import fs from 'fs';
import path from 'path';
// 在你的项目中这样使用
// import { LocalKV } from './local-kv';

// 创建实例，数据将保存在 ./db.json
// const kv = new LocalKV();

type KVValue = string | ArrayBuffer | ReadableStream | null;
type KVPutOptions = {
  expiration?: number;
  expirationTtl?: number;
};

export class LocalKV {
  private filePath: string;
  private data: Record<string, { value: string; expiration?: number }>;
  private queue: Promise<any> = Promise.resolve();

  constructor(filePath: string = './db.json') {
    this.filePath = path.resolve(filePath);
    this.data = this.loadData();
  }

  private loadData(): Record<string, { value: string; expiration?: number }> {
    try {
      if (fs.existsSync(this.filePath)) {
        const content = fs.readFileSync(this.filePath, 'utf-8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.error('Error loading KV data:', error);
    }
    return {};
  }

  private saveData(): void {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Error saving KV data:', error);
    }
  }

  private enqueue<T>(fn: () => Promise<T>): Promise<T> {
    const next = async () => fn();
    this.queue = this.queue.then(next, next);
    return this.queue;
  }

  async get(key: string, type: 'text'): Promise<string | null>;
  async get(key: string, type: 'json'): Promise<any | null>;
  async get(key: string, type: 'arrayBuffer'): Promise<ArrayBuffer | null>;
  async get(key: string, type: 'stream'): Promise<ReadableStream | null>;
  async get(key: string, type: 'text' | 'json' | 'arrayBuffer' | 'stream' = 'text'): Promise<KVValue> {
    return this.enqueue(async () => {
      const item = this.data[key];
      if (!item) return null;

      // 检查过期时间
      if (item.expiration && item.expiration < Date.now()) {
        delete this.data[key];
        this.saveData();
        return null;
      }

      switch (type) {
        case 'text':
          return item.value;
        case 'json':
          try {
            return JSON.parse(item.value);
          } catch {
            return null;
          }
        case 'arrayBuffer':
          return new TextEncoder().encode(item.value).buffer;
        case 'stream':
          // 简化实现，实际使用时需要更完整的流实现
          return new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode(item.value));
              controller.close();
            }
          });
        default:
          return null;
      }
    });
  }

  async put(key: string, value: KVValue, options?: KVPutOptions): Promise<void> {
    return this.enqueue(async () => {
      let valueStr: string;
      
      if (typeof value === 'string') {
        valueStr = value;
      } else if (value instanceof ArrayBuffer) {
        valueStr = new TextDecoder().decode(value);
      } else if (value instanceof ReadableStream) {
        // 简化实现，实际使用时需要完整的流读取
        const reader = value.getReader();
        const chunks: Uint8Array[] = [];
        let result;
        while (!(result = await reader.read()).done) {
          chunks.push(result.value);
        }
        const combined = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
          combined.set(chunk, offset);
          offset += chunk.length;
        }
        valueStr = new TextDecoder().decode(combined);
      } else {
        throw new Error('Unsupported value type');
      }

      const expiration = options?.expirationTtl 
        ? Date.now() + options.expirationTtl * 1000 
        : (options?.expiration ? options.expiration * 1000 : undefined);

      this.data[key] = {
        value: valueStr,
        expiration
      };
      
      this.saveData();
    });
  }

  async delete(key: string): Promise<void> {
    return this.enqueue(async () => {
      if (this.data[key]) {
        delete this.data[key];
        this.saveData();
      }
    });
  }

  async list(): Promise<{ keys: { name: string }[] }> {
    return this.enqueue(async () => {
      // 清理过期键
      const now = Date.now();
      Object.keys(this.data).forEach(key => {
        if (this.data[key].expiration && this.data[key].expiration! < now) {
          delete this.data[key];
        }
      });
      this.saveData();

      return {
        keys: Object.keys(this.data).map(name => ({ name }))
      };
    });
  }
}
