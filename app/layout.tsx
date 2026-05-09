import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import './globals.css';
import { Nav } from '@/components/Nav';
import { getSessionFromToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'CreateAccess — Partnership Management',
  description: 'Partnership management dashboard for CreateAccess.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const user = await getSessionFromToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="relative z-10">
          <Nav user={user} />
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
