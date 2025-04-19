import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Calendar, Clock } from 'lucide-react';
import { jwtDecode } from "jwt-decode";
import { useToast } from "@/hooks/use-toast";

interface Assignment {
  id: string;
  title: string;
  courseName: string;
  dueDate: string;
  status: 'PENDING' | 'SUBMITTED' | 'GRADED' | 'RETURNED' | 'REJECTED';
  grade?: string;
  description: string;
}

export function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found");
          return;
        }

        const decodedToken = jwtDecode(token) as { [key: string]: any };
        const userId = decodedToken.id;
        const userType = decodedToken.type;

        // Obtener todos los cursos del usuario
        const coursesResponse = await fetch(
          `https://edutalk-by8w.onrender.com/api/course/${userType}/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!coursesResponse.ok) {
          throw new Error("Error al obtener los cursos");
        }

        const courses = await coursesResponse.json();

        // Obtener todas las tareas de cada curso
        const allAssignments: Assignment[] = [];
        for (const course of courses) {
          const assignmentsResponse = await fetch(
            `https://edutalk-by8w.onrender.com/api/assignment/course/${course.id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (assignmentsResponse.ok) {
            const courseAssignments = await assignmentsResponse.json();
            const enrichedAssignments = courseAssignments.map((assignment: any) => ({
              id: assignment.id,
              title: assignment.title,
              courseName: course.name,
              dueDate: assignment.delivery_date,
              status: getAssignmentStatus(assignment),
              description: assignment.description,
            }));
            allAssignments.push(...enrichedAssignments);
          }
        }

        setAssignments(allAssignments);
      } catch (error) {
        console.error("Error fetching assignments:", error);
        toast({
          title: "Error",
          description: "Error al cargar las tareas",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignments();
  }, []);

  const getAssignmentStatus = (assignment: any): Assignment['status'] => {
    // Si la tarea tiene un estado definido, lo usamos
    if (assignment.status) {
      return assignment.status;
    }
    
    const now = new Date();
    const dueDate = new Date(assignment.delivery_date);
    
    // Si la tarea tiene una calificación, está calificada
    if (assignment.grade) {
      return 'GRADED';
    }
    
    // Si la tarea tiene una entrega, está entregada
    if (assignment.submission) {
      return 'SUBMITTED';
    }
    
    // Por defecto, está pendiente
    return 'PENDING';
  };

  const getStatusColor = (status: Assignment['status']) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-700';
      case 'SUBMITTED':
        return 'bg-emerald-100 text-emerald-700';
      case 'GRADED':
        return 'bg-blue-100 text-blue-700';
      case 'RETURNED':
        return 'bg-purple-100 text-purple-700';
      case 'REJECTED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: Assignment['status']) => {
    switch (status) {
      case 'PENDING':
        return 'Pendiente';
      case 'SUBMITTED':
        return 'Entregado';
      case 'GRADED':
        return 'Calificado';
      case 'RETURNED':
        return 'Devuelto';
      case 'REJECTED':
        return 'Rechazado';
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

  if (isLoading) {
    return <p className="text-center mt-10">Cargando tareas...</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Tareas</h1>
      <div className="grid gap-4">
        {assignments.length > 0 ? (
          assignments.map((assignment) => (
            <Link key={assignment.id} to={`/tareas/${assignment.id}`}>
              <Card className="transition-shadow hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{assignment.title}</CardTitle>
                      <CardDescription>{assignment.courseName}</CardDescription>
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
          ))
        ) : (
          <p className="text-center text-gray-500">No hay tareas disponibles.</p>
        )}
      </div>
    </div>
  );
}