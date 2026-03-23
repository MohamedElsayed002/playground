// src/app/page.tsx
// Root page: redirect to chat if logged in, login if not.
import { redirect } from 'next/navigation';
import { getSession } from '@/actions/auth.actions';
import Basketball from '@/components/ball';

export default async function RootPage() {
  return <Basketball/>
  const session = await getSession();
  if (session) redirect('/rooms');
  else         redirect('/auth/login');
}