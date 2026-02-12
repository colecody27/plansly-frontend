export type PlanType = 'trip' | 'event' | 'group';

export interface Participant {
  id: string;
  name: string;
  avatar?: string;
  status?: 'paid' | 'pending' | 'organizer' | 'admin';
  contribution?: number;
}

export interface ActivityOption {
  id: string;
  name: string;
  votes: number;
  image?: string;
}

export interface Activity {
  id: string;
  title: string;
  startTime: Date | null;
  endTime?: Date | null;
  location: string;
  description?: string;
  link?: string;
  cost?: number;
  costIsPerPerson?: boolean;
  costTotal?: number;
  payments?: string[];
  status?: string;
  options?: ActivityOption[];
  image?: string;
  isProposed?: boolean;
  hasVoted?: boolean;
  votes?: ActivityVote[];
  proposerId?: string;
  proposerName?: string;
}

export interface ActivityVote {
  id?: string;
  name: string;
  picture?: string;
}

export interface Plan {
  id: string;
  invitationId?: string;
  title: string;
  type: PlanType;
  isPublic?: boolean;
  status: string;
  deadline: Date | null;
  startDay?: Date | null;
  endDay?: Date | null;
  country?: string;
  state?: string;
  city?: string;
  location: string;
  coverImage: string;
  goal: number;
  raised: number;
  perPerson: number;
  participants: Participant[];
  organizer?: {
    id?: string;
    name?: string;
    picture?: string;
    venmo?: string;
  };
  createdAt?: Date | null;
}

export interface PlanDetail extends Plan {
  description: string;
  activities: Activity[];
  proposals: ActivityOption[];
  chat: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  senderId?: string;
  name: string;
  message: string;
  timestamp: Date | null;
  isSelf?: boolean;
}

export interface UserProfile {
  id?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatar?: string;
  venmoHandle?: string;
  bio?: string;
  mutuals?: Array<{
    id?: string;
    name?: string;
    avatar?: string;
  }>;
  plansHosted?: number;
  plansJoined?: number;
  location?: string;
  country?: string;
  state?: string;
  city?: string;
}
