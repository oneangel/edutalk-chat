import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const routes: Record<string, string> = {
  '': 'Inicio',
  'chat': 'Chat',
  'cursos': 'Cursos',
  'tareas': 'Tareas',
  'calificaciones': 'Calificaciones',
  'calendario': 'Calendario',
};

export function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600">
      <Link to="/" className="flex items-center hover:text-purple-600">
        <Home className="w-4 h-4" />
      </Link>
      {pathnames.length > 0 && <ChevronRight className="w-4 h-4" />}
      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;

        return (
          <div key={to} className="flex items-center">
            <Link
              to={to}
              className={`${
                isLast ? 'text-purple-600 font-medium' : 'hover:text-purple-600'
              }`}
            >
              {routes[value] || value}
            </Link>
            {!isLast && <ChevronRight className="w-4 h-4 ml-2" />}
          </div>
        );
      })}
    </nav>
  );
}