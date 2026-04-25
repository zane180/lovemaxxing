export interface Profile {
  id: string
  name: string
  birthdate: string
  city?: string
  bio: string
  photos: string[]
  interests?: string[]
  vibes?: string[]
  match_score?: number
  analyzed_features?: string[]
  type_preferences?: string[]
  stats?: {
    matches: number
    likes: number
    avg_score: number
  }
}

export interface User extends Profile {
  email: string
  gender: string
  interested_in: string
  onboarding_complete: boolean
  email_verified: boolean
  min_age: number
  max_age: number
  show_me: boolean
}

export interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
  read?: boolean
}

export interface Match {
  id: string
  profile: Profile
  matched_at: string
  last_message?: Message
  unread?: number
}

export interface SwipeResult {
  matched: boolean
  match_id?: string
}
