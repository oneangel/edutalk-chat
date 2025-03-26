import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Calendar, Clock } from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  class: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'late' | 'graded';
  grade?: string;
  description: string;
}

export function AssignmentsPage() {
  const assignments: Assignment[] = [
    {
      id: '1',
      title: 'Ecuaciones Diferenciales',
      class: 'Matemáticas Avanzadas',
      dueDate: '2024-03-25T23:59:59',
      status: 'pending',
      description: 'Resolver los ejercicios del capítulo 4 sobre ecuaciones diferenciales de primer orden.',
    },
    {
      id: '2',
      title: 'Análisis Literario',
      class: 'Literatura Contemporánea',
      dueDate: '2024-03-20T23:59:59',
      status: 'submitted',
      description: 'Realizar un análisis detallado del capítulo 3 de "Cien años de soledad".',
    },
    {
      id: '3',
      title: 'Leyes de Newton',
      class: 'Física Fundamental',
      dueDate: '2024-03-15T23:59:59',
      status: 'graded',
      grade: '95',
      description: 'Presentación sobre las tres leyes de Newton y sus aplicaciones en la vida cotidiana.',
    },
  ];

  const getStatusColor = (status: Assignment['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'submitted':
        return 'bg-green-100 text-green-800';
      case 'late':
        return 'bg-red-100 text-red-800';
      case 'graded':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Assignment['status']) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'submitted':
        return 'Entregado';
      case 'late':
        return 'Atrasado';
      case 'graded':
        return 'Calificado';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Tareas</h1>
      <div className="grid gap-4">
        {assignments.map((assignment) => (
          <Link key={assignment.id} to={`/tareas/${assignment.id}`}>
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{assignment.title}</CardTitle>
                    <CardDescription>{assignment.class}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className={getStatusColor(assignment.status)}>
                      {getStatusText(assignment.status)}
                    </Badge>
                    {assignment.grade && (
                      <Badge variant="secondary" className="text-blue-800 bg-blue-100">
                        {assignment.grade}/100
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-gray-600 line-clamp-2">{assignment.description}</p>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>Fecha de entrega:</span>
                  <Clock className="w-4 h-4 mx-1" />
                  <span>{formatDate(assignment.dueDate)}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}