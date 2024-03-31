import { Module } from '@nestjs/common'
import { AxiosModule } from '../axios/axios.module'
import { BrowserModule } from '../browser/browser.module'
import { ScraperController } from './scraper.controller'
import {
  FrontPageSchedulerService,
  ScraperService,
  TwitterProfileScraperService,
  TwitterTweetScraperService
} from './services'

@Module({
  imports: [AxiosModule, BrowserModule],
  controllers: [ScraperController],
  providers: [
    ScraperService,
    TwitterTweetScraperService,
    TwitterProfileScraperService,
    FrontPageSchedulerService
  ],
  exports: [
    ScraperService,
    TwitterTweetScraperService,
    TwitterProfileScraperService,
    FrontPageSchedulerService
  ]
})
export class ScraperModule {}
