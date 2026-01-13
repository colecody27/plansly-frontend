export type ApiPlanType = 'trip' | 'event' | 'group_purchase';

export interface ApiPlanCosts {
  total?: number;
  per_person?: number;
}

export interface ApiActivity {
  name?: string;
  description?: string;
  link?: string;
  cost?: number;
  start_time?: string | null;
  end_time?: string | null;
  proposer_id?: string;
  proposer_name?: string;
  proposer?: string | {
    id?: string;
    name?: string;
  };
  status?: string;
  votes?: unknown[];
}

export interface ApiMessage {
  sender_id: string;
  text: string;
  timestamp?: string | null;
}

export interface ApiPlan {
  id?: string;
  _id?: string;
  invitation_id?: string;
  name?: string;
  description?: string;
  type?: ApiPlanType;
  status?: string;
  deadline?: string | null;
  costs?: ApiPlanCosts;
  activities?: ApiActivity[];
  messages?: ApiMessage[];
  created_at?: string | null;
  start_day?: string | null;
  end_day?: string | null;
  country?: string;
  state?: string;
  city?: string;
  theme?: string;
  participant_ids?: unknown[];
  location?: string;
  cover_image?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  msg?: string;
}

export interface ApiUserProfile {
  id?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  bio?: string;
  hosting_count?: number;
  participating_count?: number;
  country?: string;
  state?: string;
  city?: string;
  picture?: string;
  avatar?: string;
  avatar_url?: string;
  venmo_handle?: string;
  venmo?: string;
}
