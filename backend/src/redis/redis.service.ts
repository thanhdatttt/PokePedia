import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redisClient!: Redis;

  constructor(private configService: ConfigService) { }

  onModuleInit() {
    this.redisClient = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),

      // retry
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });
  }

  async onModuleDestroy() {
    await this.redisClient.quit();
  }

  // OTP cache
  async setOtp(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.redisClient.set(key, value, 'EX', ttlSeconds);
  }

  async getOtp(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }

  async deleteKey(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  // Generic cache
  async get<T>(key: string): Promise<T | null> {
    const value = await this.redisClient.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null; // corrupted/incompatible cache entry
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await this.redisClient.set(key, serialized, 'EX', ttlSeconds);
    } else {
      await this.redisClient.set(key, serialized);
    }
  }

  async del(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  // Non-blocking pattern delete
  async delByPattern(pattern: string): Promise<void> {
    const stream = this.redisClient.scanStream({ match: pattern, count: 100 });
    const pipeline = this.redisClient.pipeline();
    let found = false;

    for await (const keys of stream) {
      if (keys.length) {
        found = true;
        keys.forEach((key: string) => pipeline.del(key));
      }
    }

    if (found) await pipeline.exec();
  }
}