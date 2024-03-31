import { Body, Controller, Post } from '@nestjs/common'
import { TwitterProfileDto, TwitterTargetDto } from './dto'
import { ScraperService } from './services'

@Controller('scraper')
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  @Post('twitter')
  twitterScrap(@Body() twitterScrapDto: TwitterTargetDto) {
    return this.scraperService.tweetScrape(twitterScrapDto)
  }

  @Post('twitter-profile')
  twitterProfileScrape(@Body() twitterProfileDto: TwitterProfileDto) {
    return this.scraperService.twitterProfileScrape(twitterProfileDto)
  }
}
