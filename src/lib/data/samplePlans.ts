import type { Plan, PlanDetail } from '$lib/types';

export const samplePlans: Plan[] = [
  {
    id: 'aspen-ski',
    title: 'Aspen Ski Week 2024',
    type: 'trip',
    status: '80% Funded',
    dateRange: 'Dec 15 - Dec 20',
    location: 'Aspen, CO',
    coverImage:
      'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80',
    goal: 4000,
    raised: 3200,
    perPerson: 800,
    dueBy: 'Oct 15',
    participants: [
      { id: '1', name: 'Sarah', avatar: '', status: 'organizer' },
      { id: '2', name: 'Mike', avatar: '', status: 'paid' },
      { id: '3', name: 'Alex', avatar: '', status: 'paid' }
    ]
  },
  {
    id: 'birthday-party',
    title: "Sarah's 25th Birthday",
    type: 'event',
    status: 'Voting',
    dateRange: 'Nov 02',
    location: 'San Francisco',
    coverImage:
      'https://images.unsplash.com/photo-1464349153735-7db50ed83c84?auto=format&fit=crop&w=1200&q=80',
    goal: 1500,
    raised: 620,
    perPerson: 45,
    dueBy: 'Oct 28',
    participants: [
      { id: '4', name: 'June', avatar: '', status: 'organizer' },
      { id: '5', name: 'Marco', avatar: '', status: 'pending' }
    ]
  },
  {
    id: 'pizza-night',
    title: 'Team Pizza Night',
    type: 'group',
    status: 'Due Soon',
    dateRange: 'Tonight, 7:00 PM',
    location: "Tony's Pizzeria",
    coverImage:
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80',
    goal: 180,
    raised: 120,
    perPerson: 15,
    dueBy: 'Today',
    participants: [{ id: '6', name: 'Jess', avatar: '', status: 'pending' }]
  }
];

export const samplePlanDetail: PlanDetail = {
  ...samplePlans[0],
  description:
    "It's finally time for our annual winter getaway. We'll stay near the lifts and plan a mix of slope time, cabin hangs, and a cozy group dinner.",
  activities: [
    {
      id: '1',
      title: 'Arrival & Airbnb Check-in',
      time: 'Fri, 6:00 PM',
      timeframe: '6:00 PM - 8:00 PM',
      location: '2942 Sunset Road, Aspen',
      link: 'https://maps.google.com',
      cost: 0,
      status: 'Confirmed'
    },
    {
      id: '2',
      title: 'Morning Activity',
      time: 'Sat, 10:00 AM',
      timeframe: '10:00 AM - 1:00 PM',
      location: 'Vote for your preference',
      link: 'https://maps.google.com',
      cost: 25,
      status: 'Voting Open',
      options: [
        {
          id: 'a',
          name: 'Ryan Mountain Hike',
          votes: 8,
          image:
            'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=400&q=80'
        },
        {
          id: 'b',
          name: 'Cholla Cactus Garden',
          votes: 2,
          image:
            'https://images.unsplash.com/photo-1458442310124-dde6edb43d10?auto=format&fit=crop&w=400&q=80'
        }
      ]
    }
  ],
  proposals: [
    {
      id: 'p1',
      name: "Mario's Italian Bistro",
      votes: 12
    },
    {
      id: 'p2',
      name: 'The Mountain Grill',
      votes: 4
    }
  ],
  chat: [
    {
      id: 'c1',
      name: 'Mike',
      message: 'Does anyone have extra goggles? Mine broke last year.',
      time: '10:30 AM'
    },
    {
      id: 'c2',
      name: 'You',
      message: 'I have a spare pair. I will bring them.',
      time: '10:45 AM',
      isSelf: true
    },
    {
      id: 'c3',
      name: 'Jessica',
      message: 'Has anyone checked the weather? It might be hot around noon.',
      time: '11:02 AM'
    }
  ]
};
