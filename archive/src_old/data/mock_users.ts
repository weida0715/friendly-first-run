export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'moderator';
  avatar?: string;
  bio?: string;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export const mockUsers: User[] = [
  {
    id: '0',
    username: 'admin',
    email: 'admin@loop.dev',
    name: 'Loop Admin',
    role: 'admin',
    avatar: 'https://i.pravatar.cc/150?img=12',
    bio: 'Platform administrator.',
    followers: 0,
    following: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-02-09T00:00:00Z'
  },
  {
    id: '1',
    username: 'alex',
    email: 'alex@example.com',
    name: 'Alex Trader',
    role: 'user',
    avatar: 'https://i.pravatar.cc/150?img=1',
    bio: 'Passionate crypto trader and quantitative analyst.',
    followers: 128,
    following: 34,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-02-09T00:00:00Z'
  },
  {
    id: '2',
    username: 'alina',
    email: 'alina@example.com',
    name: 'Alina Smith',
    role: 'user',
    avatar: 'https://i.pravatar.cc/150?img=2',
    bio: 'Algorithmic trading enthusiast with focus on momentum strategies.',
    followers: 342,
    following: 56,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-02-08T16:30:00Z'
  },
  {
    id: '3',
    username: 'moderator',
    email: 'moderator@loop.dev',
    name: 'Loop Moderator',
    role: 'moderator',
    avatar: 'https://i.pravatar.cc/150?img=3',
    bio: 'Community moderator and reviewer.',
    followers: 456,
    following: 78,
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-02-07T12:15:00Z'
  },
  {
    id: '4',
    username: 'user',
    email: 'user@loop.dev',
    name: 'Loop User',
    role: 'user',
    avatar: 'https://i.pravatar.cc/150?img=4',
    bio: 'Default demo account.',
    followers: 289,
    following: 45,
    created_at: '2024-01-04T00:00:00Z',
    updated_at: '2024-02-06T18:45:00Z'
  },
  {
    id: '5',
    username: 'jules',
    email: 'jules@example.com',
    name: 'Jules Verne',
    role: 'user',
    avatar: 'https://i.pravatar.cc/150?img=4',
    bio: 'Macro trader focused on Bitcoin market dynamics.',
    followers: 289,
    following: 45,
    created_at: '2024-01-04T00:00:00Z',
    updated_at: '2024-02-06T18:45:00Z'
  }
];
