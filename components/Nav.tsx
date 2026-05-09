'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Users, FileEdit, Settings, LogOut, UserRound } from 'lucide-react';
import type { AuthUser } from '@/lib/auth';

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/partners', label: 'Partners', icon: Users },
  { href: '/intake', label: 'Intake Form', icon: FileEdit },
  { href: '/admin', label: 'Admin', icon: Settings },
];

export function Nav({ user }: { user: AuthUser | null }) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  };

  return (
    <header className="border-b border-ink/10 bg-cream/80 backdrop-blur-md sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-ink flex items-center justify-center
                          group-hover:bg-court transition-colors">
            <span className="text-cream font-display font-bold text-lg">C</span>
          </div>
          <div>
            <div className="font-display font-bold text-lg leading-none">CreateAccess</div>
            <div className="text-[10px] uppercase tracking-widest text-ink/50 mt-0.5">
              Partnership Management
            </div>
          </div>
        </Link>

        {user ? (
          <div className="flex items-center gap-3">
            <nav className="hidden md:flex items-center gap-1">
              {links
                .filter(({ href }) => user.role === 'admin' || href !== '/admin')
                .map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + '/');
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all
                      ${active
                        ? 'bg-ink text-cream'
                        : 'text-ink/70 hover:text-ink hover:bg-ink/5'}`}
                  >
                    <Icon size={16} />
                    {label}
                  </Link>
                );
                })}
            </nav>
            <div className="hidden sm:flex items-center gap-2 text-sm text-ink/60 border-l border-ink/10 pl-3">
              <UserRound size={15} />
              <span>{user.displayName}</span>
              <span className="text-ink/40 uppercase tracking-widest text-[10px]">{user.role}</span>
            </div>
            <Link href="/settings" className="btn-ghost hidden md:inline-flex" title="Account settings">
              <UserRound size={14} />
            </Link>
            <button onClick={logout} className="btn-ghost hidden md:inline-flex">
              <LogOut size={14} />
              Logout
            </button>
          </div>
        ) : (
          <Link href="/login" className="btn-primary">
            <UserRound size={14} />
            Account Login
          </Link>
        )}
      </div>
    </header>
  );
}
