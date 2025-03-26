import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  MessageSquare,
  BookOpen,
  ClipboardList,
  GraduationCap,
  Calendar,
} from 'lucide-react';

export function HomePage() {
  const quickActions = [
    {
      title: 'Chat',
      description: 'Comunícate con tus compañeros y profesores',
      icon: MessageSquare,
      to: '/chat',
      color: 'bg-blue-500',
    },
    {
      title: 'Cursos',
      description: 'Accede a tus materias y recursos',
      icon: BookOpen,
      to: '/cursos',
      color: 'bg-green-500',
    },
    {
      title: 'Tareas',
      description: 'Revisa y entrega tus asignaciones',
      icon: ClipboardList,
      to: '/tareas',
      color: 'bg-yellow-500',
    },
    {
      title: 'Calificaciones',
      description: 'Consulta tu desempeño académico',
      icon: GraduationCap,
      to: '/calificaciones',
      color: 'bg-purple-500',
    },
    {
      title: 'Calendario',
      description: 'Organiza tus actividades escolares',
      icon: Calendar,
      to: '/calendario',
      color: 'bg-red-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">¡Bienvenido a EduTalk!</h1>
        <p className="mt-2 text-gray-600">
          Tu plataforma educativa integral. ¿Qué te gustaría hacer hoy?
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {quickActions.map((action) => (
          <Card key={action.to} className="transition-shadow hover:shadow-lg">
            <CardHeader className="space-y-1">
              <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-2`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-xl">{action.title}</CardTitle>
              <CardDescription>{action.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to={action.to}>
                <Button className="w-full bg-gradient-to-r from-emerald-700 to-emerald-500 hover:from-emerald-800 hover:to-emerald-700">
                  Acceder
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}