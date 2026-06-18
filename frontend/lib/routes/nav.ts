import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  BookOpen,
  FileCode,
  FlaskConical,
  Globe,
  LayoutDashboard,
  Settings,
  Shield,
  Trophy,
  Users,
} from 'lucide-react';

export interface AppNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  section: 'core' | 'admin';
  minimumRole: 'User' | 'Moderator' | 'Admin';
}

export type AppRole = 'User' | 'Moderator' | 'Admin';

const ROLE_RANK: Record<AppRole, number> = {
  User: 1,
  Moderator: 2,
  Admin: 3,
};

export const navItems: AppNavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, section: 'core', minimumRole: 'User' },
  { label: 'Experiments', href: '/experiments', icon: FlaskConical, section: 'core', minimumRole: 'User' },
  { label: 'Blueprints', href: '/blueprints', icon: FileCode, section: 'core', minimumRole: 'User' },
  { label: 'Models', href: '/models', icon: Trophy, section: 'core', minimumRole: 'User' },
  { label: 'Public Hub', href: '/hub', icon: Globe, section: 'core', minimumRole: 'User' },
  { label: 'Documentation', href: '/docs', icon: BookOpen, section: 'core', minimumRole: 'User' },
  { label: 'Users', href: '/admin/users', icon: Users, section: 'admin', minimumRole: 'Moderator' },
  { label: 'System', href: '/system', icon: Settings, section: 'admin', minimumRole: 'Admin' },
  { label: 'Moderation', href: '/blueprints/moderation', icon: Shield, section: 'admin', minimumRole: 'Moderator' },
  { label: 'Jobs', href: '/jobs', icon: Activity, section: 'admin', minimumRole: 'Moderator' },
];

export function canAccessNavItem(userRole: AppRole | undefined, minimumRole: AppRole) {
  if (!userRole) return false;
  return ROLE_RANK[userRole] >= ROLE_RANK[minimumRole];
}

export function getVisibleNavItems(args: { isAuthenticated: boolean; role?: string | null }) {
  const { isAuthenticated, role } = args;
  if (!isAuthenticated) return [];

  const r = role?.toLowerCase();
  const normalizedRole: AppRole =
    r === 'admin' || r === 'administrator' ? 'Admin' :
    r === 'moderator' || r === 'mod' ? 'Moderator' :
    'User';
  return navItems.filter((item) => canAccessNavItem(normalizedRole, item.minimumRole));
}

export function getSectionNavItems(args: {
  isAuthenticated: boolean;
  role?: string | null;
  section: 'core' | 'admin';
}) {
  return getVisibleNavItems(args).filter((item) => item.section === args.section);
}