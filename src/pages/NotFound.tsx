import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="noise relative flex min-h-screen flex-col items-center justify-center bg-bg p-4 text-center">
      <p className="display text-[30vw] leading-none text-primary md:text-[200px]">404</p>
      <p className="display text-3xl">OUT OF BOUNDS</p>
      <p className="mt-2 max-w-sm text-muted">This page is not on the field. Head back and get in the game.</p>
      <Link to="/" className="mt-8"><Button>Back to the Arena</Button></Link>
    </div>
  );
}
