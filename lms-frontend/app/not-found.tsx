import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-8xl font-extrabold text-amber-500 mb-4">404</div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Page not found</h1>
        <p className="text-gray-500 mb-8">The page you're looking for doesn't exist.</p>
        <Link href="/" className="btn-primary">← Back to Home</Link>
      </div>
    </div>
  );
}
