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
  time: string;
  timeframe?: string;
  location: string;
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
  dateRange: string;
  location: string;
  coverImage: string;
  goal: number;
  raised: number;
  perPerson: number;
  dueBy: string;
  participants: Participant[];
}

export interface PlanDetail extends Plan {
  description: string;
  activities: Activity[];
  proposals: ActivityOption[];
  chat: {
    id: string;
    name: string;
    message: string;
    time: string;
    isSelf?: boolean;
  }[];
}
