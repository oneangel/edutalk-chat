import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, BookOpen, Users, Calendar, ClipboardList } from 'lucide-react';

interface Class {
  id: string;
  name: string;
  teacher: string;
  subject: string;
  schedule: string;
  coverImage: string;
  studentCount: number;
  assignments: Assignment[];
}

interface Assignment {
  id: string;
  title: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'late' | 'graded';
  grade?: string;
  description: string;
}

export function ClassesPage() {
  const [classCode, setClassCode] = useState('');
  const navigate = useNavigate();

  const classes: Class[] = [
    {
      id: '1',
      name: 'Matemáticas Avanzadas',
      teacher: 'Prof. María González',
      subject: 'Matemáticas',
      schedule: 'Lunes y Miércoles 9:00 AM',
      coverImage: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=2940&ixlib=rb-4.0.3',
      studentCount: 25,
      assignments: [
        {
          id: '1',
          title: 'Ecuaciones Diferenciales',
          dueDate: '2024-03-25T23:59:59',
          status: 'pending',
          description: 'Resolver los ejercicios del capítulo 4 sobre ecuaciones diferenciales de primer orden.',
        },
        {
          id: '2',
          title: 'Límites y Continuidad',
          dueDate: '2024-03-28T23:59:59',
          status: 'pending',
          description: 'Ejercicios sobre límites y continuidad de funciones.',
        },
      ],
    },
    {
      id: '2',
      name: 'Física Fundamental',
      teacher: 'Prof. Carlos Ruiz',
      subject: 'Física',
      schedule: 'Martes y Jueves 10:30 AM',
      coverImage: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&q=80&w=2940&ixlib=rb-4.0.3',
      studentCount: 20,
      assignments: [
        {
          id: '3',
          title: 'Leyes de Newton',
          dueDate: '2024-03-15T23:59:59',
          status: 'graded',
          grade: '95',
          description: 'Presentación sobre las tres leyes de Newton y sus aplicaciones en la vida cotidiana.',
        },
      ],
    },
    {
      id: '3',
      name: 'Literatura Contemporánea',
      teacher: 'Prof. Ana Martínez',
      subject: 'Literatura',
      schedule: 'Viernes 11:00 AM',
      coverImage: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=2940&ixlib=rb-4.0.3',
      studentCount: 30,
      assignments: [
        {
          id: '4',
          title: 'Análisis Literario',
          dueDate: '2024-03-20T23:59:59',
          status: 'submitted',
          description: 'Realizar un análisis detallado del capítulo 3 de "Cien años de soledad".',
        },
      ],
    },
  ];

  const handleJoinClass = () => {
    // Handle joining class logic here
    console.log('Joining class with code:', classCode);
    setClassCode('');
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Mis Clases</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Unirse a una clase
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Unirse a una clase</DialogTitle>
              <DialogDescription>
                Ingresa el código de la clase proporcionado por tu profesor
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <Input
                placeholder="Código de la clase"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)}
              />
              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                onClick={handleJoinClass}
              >
                Unirse
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {classes.map((classItem) => (
          <Card key={classItem.id} className="overflow-hidden transition-shadow hover:shadow-lg">
            <div
              className="h-32 bg-center bg-cover"
              style={{ backgroundImage: `url(${classItem.coverImage})` }}
            />
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Información</TabsTrigger>
                <TabsTrigger value="assignments">Tareas</TabsTrigger>
              </TabsList>
              <TabsContent value="info">
                <CardHeader>
                  <CardTitle className="text-xl">{classItem.name}</CardTitle>
                  <CardDescription>{classItem.teacher}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center">
                      <BookOpen className="w-4 h-4 mr-2" />
                      <span>{classItem.subject}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{classItem.schedule}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      <span>{classItem.studentCount} estudiantes</span>
                    </div>
                  </div>
                </CardContent>
              </TabsContent>
              <TabsContent value="assignments">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <ClipboardList className="w-5 h-5 mr-2" />
                    Tareas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {classItem.assignments.map((assignment) => (
                      <Card
                        key={assignment.id}
                        className="transition-shadow cursor-pointer hover:shadow-md"
                        onClick={() => navigate(`/tareas/${assignment.id}`)}
                      >
                        <CardHeader className="p-4">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{assignment.title}</CardTitle>
                            <Badge variant="secondary" className={getStatusColor(assignment.status)}>
                              {getStatusText(assignment.status)}
                            </Badge>
                          </div>
                          <CardDescription className="text-xs">
                            Entrega: {formatDate(assignment.dueDate)}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </TabsContent>
            </Tabs>
          </Card>
        ))}
      </div>
    </div>
  );
}