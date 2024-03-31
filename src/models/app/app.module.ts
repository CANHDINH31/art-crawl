import { RedisModule } from '@nestjs-modules/ioredis'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScraperModule } from '../scraper/scraper.module'
import { AppController } from './app.controller'
import { AppService } from './app.service'

@Module({
  imports: [
    ScraperModule,
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => ({
        config: {
          host: 'redis-18799.c252.ap-southeast-1-1.ec2.cloud.redislabs.com',
          port: 18799,
          password: 'wsNQptisr0sorslPrwQiPcT940H0DPZV'
        }
      })
    }),
    ConfigModule.forRoot({ envFilePath: '.env.headfull', isGlobal: true })
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
