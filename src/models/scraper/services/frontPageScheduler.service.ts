import { Injectable } from '@nestjs/common'
import { Page } from 'puppeteer'

@Injectable()
export class FrontPageSchedulerService {
  private static state = new Uint8Array(new SharedArrayBuffer(1024))
  private static persistTimeout = 1000 * 60 * 5 // 5 minutes

  static async persistToFront(page: Page) {
    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        const oldState = Atomics.compareExchange(
          FrontPageSchedulerService.state,
          0,
          0,
          1
        )
        if (oldState === 0) {
          clearInterval(interval)
          resolve()
        }
      }, 100)
      // if timeout, clear interval
      setTimeout(() => {
        clearInterval(interval)
        resolve()
      }, FrontPageSchedulerService.persistTimeout)
    })
    await page.bringToFront()
    page.once('close', this.depersistToFront)
  }

  static depersistToFront() {
    Atomics.compareExchange(FrontPageSchedulerService.state, 0, 1, 0)
  }
}
