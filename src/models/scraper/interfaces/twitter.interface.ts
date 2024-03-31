export interface ITweetBaseData {
  tweet_url: string
  tweet_id: string
  username: string
  profile_img_url: string
  name: string
  replies: number
  retweets: number
  likes: number
  views: number
  is_retweet: boolean
  posted_time: string
  content: string
  hashtags: string[]
  mentions: string[]
  images: string[]
  videos: string[]
  external_links: string[]
}

export interface IOwnerData {
  follower: number
  following: number
}

export type ITweetData = ITweetBaseData & {
  top_comment: ITweetBaseData
  owner: IOwnerData
}

export interface ICreateTweetsData {
  target_id: number
  last_crawl_at: Date
  list_posts: ITweetBaseData[]
}

export interface ICreateProfileData {
  profile_id: number
  follower_count: number
  date: Date
}
