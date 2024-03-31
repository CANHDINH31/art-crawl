// import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq'
import { Module } from '@nestjs/common'
import { AxiosModule } from '../axios/axios.module'
import { BrowserModule } from '../browser/browser.module'
import { ScraperController } from './scraper.controller'
import {
  FrontPageSchedulerService,
  ScraperService,
  SubscribeService,
  TwitterProfileScraperService,
  TwitterTweetScraperService
} from './services'

@Module({
  imports: [
    // RabbitMQModule.forRootAsync(RabbitMQModule, {
    //   imports: [ConfigModule],
    //   useFactory: () => ({
    //     uri: process.env.RABBITMQ_URI || '',
    //     channels: {
    //       [crawlTweetChannel]: { prefetchCount: 1 },
    //       [crawlProfileChannel]: { prefetchCount: 5 }
    //     },
    //     connectionInitOptions: { wait: false }
    //   })
    // }),
    AxiosModule,
    BrowserModule
  ],
  controllers: [ScraperController],
  providers: [
    ScraperService,
    TwitterTweetScraperService,
    TwitterProfileScraperService,
    SubscribeService,
    FrontPageSchedulerService
  ],
  exports: [
    ScraperService,
    TwitterTweetScraperService,
    TwitterProfileScraperService,
    SubscribeService,
    FrontPageSchedulerService
  ]
})
export class ScraperModule {}
