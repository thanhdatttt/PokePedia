import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

@Global() // global module
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}