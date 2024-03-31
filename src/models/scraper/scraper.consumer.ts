import { Process, Processor } from '@nestjs/bull'
import { ConfigService } from '@nestjs/config'
import { Job } from 'bull'
import { AxiosService } from '../axios/axios.service'

@Processor('twitter-profile')
export class ScraperConsumer {
  constructor(
    private configService: ConfigService,
    private readonly axiosService: AxiosService
  ) {}
  @Process()
  async twitterProfile(job: Job) {
    try {
      await this.axiosService.axiosRef.put(
        this.configService.get('DOMAIN_API') + '/profiles/update-by-username',
        job.data.info
      )
      console.log('succeess')
    } catch (error) {
      throw error
    }
  }
}
