// src/app/page.tsx
// Root page: redirect to chat if logged in, login if not.
import { redirect } from 'next/navigation';
import { getSession } from '@/actions/auth.actions';

export default async function RootPage() {
  const session = await getSession();
  if (session) redirect('/rooms');
  else         redirect('/auth/login');
}