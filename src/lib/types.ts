export type PlanType = 'trip' | 'event' | 'group';

export interface Participant {
  id: string;
  name: string;
  avatar?: string;
  status?: 'paid' | 'pending' | 'organizer';
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
  status?: string;
  options?: ActivityOption[];
}

export interface Plan {
  id: string;
  title: string;
  type: PlanType;
  status: string;
  deadline: Date | null;
  location: string;
  coverImage: string;
  goal: number;
  raised: number;
  perPerson: number;
  participants: Participant[];
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
  name: string;
  message: string;
  timestamp: Date | null;
  isSelf?: boolean;
}
