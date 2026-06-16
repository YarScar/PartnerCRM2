import Link from 'next/link';
import { cookies } from 'next/headers';
import { getSessionFromToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { PublicIntakeForm } from '@/components/PublicIntakeForm';

export default async function IntakePage() {
  const cookieStore = await cookies();
  const user = await getSessionFromToken(cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null);
  const isAdmin = user?.role === 'admin';

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 md:py-16">
      {isAdmin && (
        <div className="mb-6 flex justify-end">
          <Link href="/admin/intake" className="btn-ghost">Edit Intake Form</Link>
        </div>
      )}
      <div className="grid lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-5 space-y-6">
          <div className="text-xs uppercase tracking-widest text-court font-semibold">
            🏀 Partnership Inquiry
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-bold tracking-tight">
            Start the conversation.
          </h1>
          <p className="text-ink/70 text-lg leading-relaxed max-w-xl">
            This public intake is the first step for organizations that want to work with CreateAccess.
            Keep it short, send it along, and we’ll follow up after review.
          </p>
          <div className="card bg-ink text-cream border-ink/80">
            <div className="text-[10px] uppercase tracking-widest text-cream/60 mb-3">
              What happens next
            </div>
            <ul className="space-y-2 text-sm text-cream/80">
              <li>We save your submission as a pending intake.</li>
              <li>The CreateAccess team gets an email notification.</li>
              <li>Staff can open the record later and add the full details.</li>
            </ul>
          </div>
        </div>

        <div className="lg:col-span-7">
          <PublicIntakeForm />
        </div>
      </div>
    </div>
  );
}
