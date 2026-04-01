// src/app/page.tsx
// Root page: redirect to chat if logged in, login if not.
import { redirect } from 'next/navigation';
import { getSession } from '@/actions/auth.actions';
import Basketball from '@/components/ball';
import BackgroundBeamsDemo from '../components/layouts/beams';
import DotPatternDemo from '@/components/layouts/dot-pattern';
import BackgroundPathsDemo from '@/components/layouts/retero-grid';

export default async function RootPage() {
// 
  // const data = await fetch('http://localhost:8000/health').catch(() => {})
  // const res = await data.json()
  // console.log('backend', res)

  return <BackgroundPathsDemo/>
  // return <Basketball/>
  const session = await getSession();
  if (session) redirect('/rooms');
  else         redirect('/auth/login');
}