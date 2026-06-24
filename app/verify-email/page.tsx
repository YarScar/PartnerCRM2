import Link from 'next/link';

export default function VerifyEmailPage({ searchParams }: { searchParams: { verified?: string } }) {
  const status = searchParams?.verified || 'success';
  if (status === 'success') {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <h1 className="text-2xl font-semibold">Thank you — your email is verified</h1>
        <p className="mt-4 text-gray-600">Your email address has been successfully verified. You can now access the dashboard and receive email notifications.</p>
        <div className="mt-6">
          <Link href="/dashboard" className="inline-block rounded bg-green-600 text-white px-4 py-2">Go to dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-semibold text-red-600">Verification failed</h1>
      <p className="mt-4 text-gray-600">The verification link is invalid or has expired. You can request a new verification email from your account settings.</p>
      <div className="mt-6">
        <Link href="/settings" className="inline-block rounded bg-blue-600 text-white px-4 py-2">Open settings</Link>
      </div>
    </div>
  );
}
