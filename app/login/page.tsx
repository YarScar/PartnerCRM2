import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { ArrowLeft } from 'lucide-react';
import { SESSION_COOKIE_NAME, getSessionFromToken } from '@/lib/auth';
import { LoginForm } from '@/components/LoginForm';

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const cookieStore = await cookies();
  const user = await getSessionFromToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (user) redirect('/dashboard');
  const { next } = await searchParams;

  return (
    <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
      <div className="grid md:grid-cols-12 gap-8 items-center">
        <div className="md:col-span-7">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-ink mb-8">
            <ArrowLeft size={14} />
            Back to landing
          </Link>
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-court font-semibold mb-6">
            <span className="w-8 h-px bg-court"></span>
            Secure workspace
          </div>
          <h1 className="font-display text-6xl md:text-7xl lg:text-8xl font-black leading-[0.95] mb-6">
            Account-based<br />
            access for the
            <span className="text-court italic font-light"> internal team.</span>
          </h1>
          <p className="text-lg text-ink/70 max-w-xl leading-relaxed">
            Staff can manage partners and notes here. Admin accounts can also edit the intake and partner form builder, and remove partners.
          </p>
        </div>

        <div className="md:col-span-5 flex justify-center md:justify-end">
          <LoginForm nextPath={next} />
        </div>
      </div>
    </div>
  );
}
