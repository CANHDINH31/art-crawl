import { Body, Controller, Post } from '@nestjs/common'
import { TwitterTargetDto } from './dto'
import { ScraperService } from './services'

@Controller('scraper')
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  @Post('twitter')
  twitterScrap(@Body() twitterScrapDto: TwitterTargetDto) {
    return this.scraperService.tweetScrape(twitterScrapDto)
  }

  @Post('twitter-profile')
  twitterProfileScrape() {
    return this.scraperService.twitterProfileScrape()
  }
}
