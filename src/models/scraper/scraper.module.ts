import { BullModule } from '@nestjs/bull'
import { Module } from '@nestjs/common'
import { AxiosModule } from '../axios/axios.module'
import { BrowserModule } from '../browser/browser.module'
import { ScraperConsumer } from './scraper.consumer'
import { ScraperController } from './scraper.controller'
import {
  ScraperService,
  TwitterProfileScraperService,
  TwitterTweetScraperService
} from './services'

@Module({
  imports: [
    AxiosModule,
    BrowserModule,
    BullModule.registerQueue({
      name: 'twitter-profile'
    })
  ],
  controllers: [ScraperController],
  providers: [
    ScraperService,
    TwitterTweetScraperService,
    TwitterProfileScraperService,
    ScraperConsumer
  ],
  exports: [
    ScraperService,
    TwitterTweetScraperService,
    TwitterProfileScraperService
  ]
})
export class ScraperModule {}
