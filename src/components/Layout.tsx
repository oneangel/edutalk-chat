import { Outlet } from 'react-router-dom';
import { Navbar } from '@/components/navigation/Navbar';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-4">
        <Breadcrumbs />
        <main className="mt-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}