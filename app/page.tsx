import Link from 'next/link';
import { ArrowRight, FileEdit, LayoutDashboard } from 'lucide-react';
import { cookies } from 'next/headers';
import { getSessionFromToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export default async function Home() {
  const cookieStore = await cookies();
  const user = await getSessionFromToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  return (
    <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
      <div className="grid md:grid-cols-12 gap-8 items-center">
        <div className="md:col-span-7">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-court font-semibold mb-6">
            <span className="w-8 h-px bg-court"></span>
            Partnership Management
          </div>
          <h1 className="font-display text-6xl md:text-7xl lg:text-8xl font-black leading-[0.95] mb-6">
            Where every<br />
            partnership
            <span className="text-court italic font-light"> finds its</span><br />
            rhythm.
          </h1>
          <p className="text-lg text-ink/70 max-w-xl mb-10 leading-relaxed">
            Track every conversation, every program, every piece of hardware
            in one place. Built for the team behind CreateAccess —
            so no relationship slips through the cracks.
          </p>
          <div className="flex flex-wrap gap-3">
            {user ? (
              <Link href="/dashboard" className="btn-primary">
                <LayoutDashboard size={16} />
                Open Dashboard
                <ArrowRight size={16} />
              </Link>
            ) : (
              <Link href="/login" className="btn-primary">
                <ArrowRight size={16} />
                Account Login
              </Link>
            )}
            <Link href="/intake" className="btn-secondary">
              <FileEdit size={16} />
              Public Intake Form
            </Link>
          </div>
        </div>

        <div className="md:col-span-5 hidden md:block">
          <div className="relative">
            <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full bg-court/10 blur-2xl"></div>
            <div className="relative bg-ink text-cream rounded-3xl p-8 transform rotate-2 shadow-2xl">
              <div className="text-[10px] uppercase tracking-widest text-cream/50 mb-3">
                Snapshot
              </div>
              <div className="font-display text-5xl font-bold mb-1">6</div>
              <div className="text-cream/70 text-sm mb-6">active partners</div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-cream/60">In conversation</span>
                  <span className="font-mono">3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cream/60">Pending action</span>
                  <span className="font-mono text-court">2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cream/60">Active programs</span>
                  <span className="font-mono">1</span>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 bg-court text-cream rounded-2xl p-4 transform -rotate-3 shadow-xl">
              <div className="font-display font-bold text-2xl">🏀</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
