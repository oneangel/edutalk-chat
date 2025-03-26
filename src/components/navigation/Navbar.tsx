import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { removeToken } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import {
  Home,
  MessageSquare,
  GraduationCap,
  ClipboardList,
  Award,
  Calendar,
  LogOut,
} from 'lucide-react';

export function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="container px-4 mx-auto">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-xl font-bold text-purple-600">
              EduTalk
            </Link>
            <div className="items-center hidden space-x-4 md:flex">
              <NavLink to="/" icon={<Home className="w-4 h-4" />}>
                Inicio
              </NavLink>
              <NavLink to="/chat" icon={<MessageSquare className="w-4 h-4" />}>
                Chat
              </NavLink>
              <NavLink to="/clases" icon={<GraduationCap className="w-4 h-4" />}>
                Clases
              </NavLink>
              <NavLink to="/tareas" icon={<ClipboardList className="w-4 h-4" />}>
                Tareas
              </NavLink>
              <NavLink to="/calificaciones" icon={<Award className="w-4 h-4" />}>
                Calificaciones
              </NavLink>
              <NavLink to="/calendario" icon={<Calendar className="w-4 h-4" />}>
                Calendario
              </NavLink>
            </div>
          </div>
          <Button
            variant="ghost"
            className="text-gray-600 hover:text-gray-900"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar sesión
          </Button>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ to, icon, children }: { to: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="flex items-center space-x-2 text-gray-600 transition-colors hover:text-purple-600"
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}