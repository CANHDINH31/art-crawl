import { InjectQueue } from '@nestjs/bull'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Queue } from 'bull'
import { AxiosService } from 'src/models/axios/axios.service'
import { PageService } from 'src/models/browser/page.service'
import { BrowserService } from '../../browser/browser.service'
import { TwitterTargetDto, TwitterTargetType } from '../dto'
import { ITweetBaseData, ITweetData } from '../interfaces'
import {
  TwitterProfileScraperService,
  TwitterTweetScraperService
} from './workers'

@Injectable()
export class ScraperService {
  private readonly RETRY_TIMES = 3
  constructor(
    private readonly axiosService: AxiosService,
    private readonly browserService: BrowserService,
    private readonly pageService: PageService,
    private readonly twitterTweetScraperService: TwitterTweetScraperService,
    private readonly twitterProfileScraperService: TwitterProfileScraperService,
    private configService: ConfigService,
    @InjectQueue('twitter-profile') private twitterProfileQueue: Queue,
    @InjectQueue('tweet') private tweetQueue: Queue
  ) {}

  async listTweet() {
    try {
      await this.tweetQueue.empty()

      const res = await this.axiosService.axiosRef.get(
        this.configService.get('DOMAIN_API') + '/targets?status=1'
      )

      const resultTaget = res.data?.map((e) => ({
        id: e._id,
        keywords: e?.keywords,
        hashtags: e?.hashtags,
        urls: e?.urls
      }))

      const listTarget = this._gennerateTarget(resultTaget)

      for (const target of listTarget) {
        const data = await this.tweetScrape(target as TwitterTargetDto)
        data?.length > 0 &&
          this.tweetQueue.add({
            target: target.id,
            lastCrawl: new Date(),
            data
          })
      }

      return 'crawl tweet finnish'
    } catch (error) {
      throw error
    }
  }

  async tweetScrape(twitterScrapTweetDto: TwitterTargetDto) {
    const profile = await this._tweetScrape(twitterScrapTweetDto)
    return profile
  }

  private async _tweetScrape(twitterScrapTweetDto: TwitterTargetDto) {
    const urls = this._generateURLS(twitterScrapTweetDto)
    if (!BrowserService.BROWSER_LIST.BROWSER)
      await this.browserService.initBrowser()
    const tweetData: ITweetData[] = []

    try {
      const listSearchableTweets = await this._getSearchableTweets(urls)
      for (const searchableTweets of listSearchableTweets) {
        if (searchableTweets.status === 'rejected') continue

        const detailData = await this._getDetailData(searchableTweets.value)

        const listTweet = detailData.reduce<ITweetData[]>(
          (acc, detail, index) => {
            if (detail.status === 'fulfilled') {
              acc.push({
                ...searchableTweets.value[index],
                topComment: detail.value[0],
                follower: detail.value[1]?.follower as string,
                following: detail.value[1]?.following as string
              })
            }
            return acc
          },
          []
        )
        console.log('listTweet:', listTweet.length)
        if (listTweet.length == 0) break
        tweetData.push(...listTweet)
      }
    } catch (error) {
      throw error
    }
    return tweetData
  }

  private async _getSearchableTweets(urls: string[]) {
    return Promise.allSettled(
      urls.map(async (url) => {
        const [searchTweetPage] = await this.pageService.initBrowserPage(1)
        await searchTweetPage.goto(url, { waitUntil: 'networkidle2' })
        await searchTweetPage.bringToFront()
        const searchableTweet =
          await this.twitterTweetScraperService.scrapeListTweet(searchTweetPage)
        this.pageService.closePages(searchTweetPage)
        return searchableTweet
      })
    )
  }

  private async _getDetailData(searchableTweets: ITweetBaseData[]) {
    return Promise.allSettled(
      searchableTweets.map(({ tweetUrl, username }) =>
        Promise.all([
          this._getTopComment(tweetUrl),
          this.twitterProfileScrape(username)
        ])
      )
    )
  }

  private _getTopComment(tweetUrl: string) {
    return this._getTopCommentHandle(tweetUrl, this.RETRY_TIMES)
  }

  private async _getTopCommentHandle(tweetUrl: string, retryCount: number) {
    const [tweetPage] = await this.pageService.initBrowserSmallPage(1)

    try {
      await tweetPage.goto(tweetUrl, {
        waitUntil: 'networkidle2',
        timeout: 0
      })
      return await this.twitterTweetScraperService.scrapeTopComment(tweetPage)
    } catch (error: any) {
      console.log('topCommentHandle ~ error:', error.message, retryCount)
      if (retryCount <= 0) throw error
      return this._getTopCommentHandle(tweetUrl, retryCount - 1)
    } finally {
      this.pageService.closePages(tweetPage)
    }
  }

  async listTwitterProfileScrape() {
    try {
      await this.twitterProfileQueue.empty()
      const res = await this.axiosService.axiosRef.get(
        this.configService.get('DOMAIN_API') + '/profiles/list-username'
      )

      const listUsername = res.data?.map((e) => e.username)

      for (const username of listUsername) {
        const info = await this.twitterProfileScrape(username)
        await this.twitterProfileQueue.add({ info })
      }
      return 'crawl twiiter profile finnish'
    } catch (error) {
      throw error
    }
  }

  async twitterProfileScrape(username: string) {
    const profileURL = 'https://twitter.com/' + username
    const [page] = await this.pageService.initBrowserPage(1)
    try {
      await page.goto(profileURL, { waitUntil: 'networkidle2', timeout: 0 })
      const data = await this.twitterProfileScraperService.scrape(page)
      return data
    } catch (error) {
      throw error
    } finally {
      this.pageService.closePages(page)
    }
  }

  private _generateURLS({ hashtags, keywords, url, type }: TwitterTargetDto) {
    switch (type) {
      case TwitterTargetType.URL:
        return url
      case TwitterTargetType.KEYWORDS:
        return keywords.map((keyword) => this._getSearchUrl(keyword))
      case TwitterTargetType.HASHTAGS:
        return hashtags.map((hashtag) =>
          this._getSearchUrl(`(%23${hashtag.slice(1)})`)
        )
      default:
        return []
    }
  }

  private _getSearchUrl = (query: string) =>
    `https://twitter.com/search?q=${query}%20min_replies%3A10&src=typed_query`

  private _gennerateTarget(
    listTarget: {
      id: string
      urls?: string[]
      keywords?: string[]
      hashtags?: string[]
    }[]
  ) {
    const newList = listTarget.flatMap((target) => {
      const urlItem = {
        id: target.id,
        type: TwitterTargetType.URL,
        url: target?.urls
      }

      const keywordItem = {
        id: target.id,
        type: TwitterTargetType.KEYWORDS,
        keywords: target?.keywords
      }

      const hashtagItem = {
        id: target.id,
        type: TwitterTargetType.HASHTAGS,
        hashtags: target?.hashtags
      }

      return [urlItem, keywordItem, hashtagItem]
    })

    return newList
  }
}
