import { NavItem } from '@/types';

export type Product = {
  photo_url: string;
  name: string;
  description: string;
  created_at: string;
  price: number;
  id: number;
  category: string;
  updated_at: string;
};

// Helper to prefix URLs with firmSlug
export const getNavItems = (firmSlug: string): NavItem[] => [
  {
    title: 'Dashboard',
    url: `/${firmSlug}/dashboard/overview`,
    icon: 'dashboard',
    isActive: false,
    shortcut: ['d', 'd'],
    items: []
  },
];

export const getNavItemsAdmin = (firmSlug: string): NavItem[] => [
  {
    title: 'Firmes',
    url: `/${firmSlug}/dashboard/firmes`,
    icon: 'building',
    isActive: false,
    shortcut: ['f', 'f'],
    items: [
      {
        title: 'Toutes les firmes',
        url: `/${firmSlug}/dashboard/firmes/`,
        isActive: false,
        shortcut: ['c', 'c']
      },
      {
        title: 'Créer une firme',
        url: `/${firmSlug}/dashboard/firmes/nouveau`,
        isActive: false,
        shortcut: ['c', 'c']
      }
    ]
  },
  {
    title: 'Utilisateurs',
    url: `/${firmSlug}/dashboard/utilisateurs`,
    icon: 'user2',
    isActive: false,
    shortcut: ['u', 'u'],
    items: [
      {
        title: 'Liste',
        url: `/${firmSlug}/dashboard/utilisateurs/`,
        isActive: false,
        shortcut: ['c', 'c']
      },
      {
        title: 'Nouveau',
        url: `/${firmSlug}/dashboard/utilisateurs/nouveau`,
        isActive: false,
        shortcut: ['c', 'c']
      }
    ]
  },
  {
    title: 'Modules',
    url: `/${firmSlug}/dashboard/modules`,
    icon: 'commandIcon',
    isActive: false,
    shortcut: ['m', 'm'],
    items: []
  }
];

export interface SaleUser {
  id: number;
  name: string;
  email: string;
  amount: string;
  image: string;
  initials: string;
}

export const recentSalesData: SaleUser[] = [
  {
    id: 1,
    name: 'Olivia Martin',
    email: 'olivia.martin@email.com',
    amount: '+$1,999.00',
    image: 'https://api.slingacademy.com/public/sample-users/1.png',
    initials: 'OM'
  },
  {
    id: 2,
    name: 'Jackson Lee',
    email: 'jackson.lee@email.com',
    amount: '+$39.00',
    image: 'https://api.slingacademy.com/public/sample-users/2.png',
    initials: 'JL'
  },
  {
    id: 3,
    name: 'Isabella Nguyen',
    email: 'isabella.nguyen@email.com',
    amount: '+$299.00',
    image: 'https://api.slingacademy.com/public/sample-users/3.png',
    initials: 'IN'
  },
  {
    id: 4,
    name: 'William Kim',
    email: 'will@email.com',
    amount: '+$99.00',
    image: 'https://api.slingacademy.com/public/sample-users/4.png',
    initials: 'WK'
  },
  {
    id: 5,
    name: 'Sofia Davis',
    email: 'sofia.davis@email.com',
    amount: '+$39.00',
    image: 'https://api.slingacademy.com/public/sample-users/5.png',
    initials: 'SD'
  }
];
