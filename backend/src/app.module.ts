import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './redis/redis.module';
import { DatabaseModule } from './database/database.module';
import { envValidationSchema } from './config/env.validation';
import { PokemonModule } from './pokemon/pokemon.module';

@Module({
  imports: [ 
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema
    }), 
    
    DatabaseModule, AuthModule, RedisModule, PokemonModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
