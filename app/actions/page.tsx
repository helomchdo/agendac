import { redirect } from 'next/navigation';

export default function ActionsPage() {
  // Redirect to the new action page by default for now
  redirect ('/actions/new');
}

