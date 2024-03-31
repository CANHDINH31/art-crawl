import { Nack, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq'
import { Injectable } from '@nestjs/common'
import { AxiosResponse } from 'axios'
import {
  crawlProfileChannel,
  crawlProfileQueueName,
  crawlProfileRoutingKey,
  crawlTweetChannel,
  crawlTweetQueueName,
  crawlTweetRoutingKey,
  instanceTransformer,
  socialAIExchange
} from 'src/common'
import { AxiosService } from 'src/models/axios/axios.service'
import { TwitterProfileDto, TwitterTargetDto } from '../dto'
import { ICreateProfileData } from '../interfaces'
import { ScraperService } from './scraper.service'

@Injectable()
export class SubscribeService {
  constructor(
    private readonly scraperService: ScraperService,
    private readonly axiosService: AxiosService
  ) {}

  @RabbitSubscribe({
    exchange: socialAIExchange,
    routingKey: crawlTweetRoutingKey,
    queue: crawlTweetQueueName,
    queueOptions: { channel: crawlTweetChannel }
  })
  public async crawlTweetSubscriber(msg) {
    try {
      console.log(`Received message 🚀`, msg)
      const target = instanceTransformer(TwitterTargetDto, msg, {
        exposeUnsetFields: false
      })

      await this.scraperService.tweetScrape(target)
    } catch (error: any) {
      console.log('SubscribeService ~ subHandler ~ error:❌❌❌', error)
      return new Nack(true)
    }
  }

  @RabbitSubscribe({
    exchange: socialAIExchange,
    routingKey: crawlProfileRoutingKey,
    queue: crawlProfileQueueName,
    queueOptions: { channel: crawlProfileChannel }
  })
  public async crawlProfileSubscriber(msg) {
    try {
      console.log(`Received message 🚀`, msg)
      const profileData = instanceTransformer(TwitterProfileDto, msg, {
        exposeUnsetFields: false
      })

      const profile = await this.scraperService.twitterProfileScrape(
        profileData
      )
      if (profile) {
        // call api to save data
        const data: ICreateProfileData = {
          profile_id: profileData.id,
          follower_count: profile.follower,
          date: profileData.date
        }

        const res = await this.axiosService.axiosRef.post<
          string,
          AxiosResponse<string, any>,
          ICreateProfileData
        >(process.env.SOCIAL_API_SAVE_PROFILE_URL || '', data)
        console.log(
          'SubscribeService ~ crawlProfileSubscriber ~ res:',
          res.data
        )
      }
      return
    } catch (error: any) {
      console.log('SubscribeService ~ subHandler ~ error:❌❌❌', error.message)
      return new Nack(true)
    }
  }
}
