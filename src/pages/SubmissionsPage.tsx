import { useEffect, useState } from "react";
import { Assignment, Submission } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmissionItem } from "../components/assignment/SubmissionItem";
import { Clock } from "lucide-react";
import { useParams } from "react-router-dom";

export function SubmissionsPage() {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const { id } = useParams();

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found");
          return;
        }
  
        // 1. Obtener las submissions
        const submissionsResponse = await fetch(
          `https://edutalk-by8w.onrender.com/api/submission/assignment/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
  
        if (!submissionsResponse.ok) throw new Error("Error al obtener entregas");
        const submissionsData = await submissionsResponse.json();
  
        // 2. Obtener información de usuarios para TODOS los estudiantes que han entregado
        const uniqueStudentIds = [...new Set(submissionsData.map((s: any) => s.student_id))];
        
        const usersPromises = uniqueStudentIds.map(studentId => 
          fetch(`https://edutalk-by8w.onrender.com/api/user/${studentId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
        );
  
        const usersResponses = await Promise.all(usersPromises);
        const usersData = await Promise.all(usersResponses.map(res => res.ok ? res.json() : null));
  
        // 3. Combinar la información
        const normalized = submissionsData.map((submission: Submission) => {
          const deliveryDate = new Date(assignment?.delivery_date ?? "");
          const submissionDate = new Date(submission.createdAt);
          
          // Encontrar el usuario correspondiente (student_id = user_id)
          const user = usersData.find(u => u?.id === submission.student_id);
  
          return {
            ...submission,
            status: submission.status.toLowerCase(),
            onTime: submissionDate <= deliveryDate,
            student: user ? {
              name: user.name || 'Sin nombre',
              lastname: user.lastname || 'Sin apellido'
            } : undefined
          };
        });
  
        setSubmissions(normalized);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
  
    if (id) fetchSubmissions();
  }, [id, assignment?.delivery_date]);

  const updateGrade = async (submissionId: string, grade: number | null) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        return;
      }
  
      const response = await fetch(
        `https://edutalk-by8w.onrender.com/api/submission/${submissionId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            grade: grade, 
            status: "GRADED"
          }),
        }
      );
  
      if (!response.ok) {
        throw new Error("Error al actualizar la calificación");
      }
    } catch (error) {
      console.error(error);
    }
  };
  
  
  const handleGradeUpdate = async (submissionId: string, newGrade: number | null): Promise<void> => {
    try {
      await updateGrade(submissionId, newGrade);
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submissionId
            ? {
                ...s,
                grade: newGrade,
                status: newGrade !== null ? "graded" : "submitted",
              }
            : s
        )
      );
    } catch (error) {
      console.error("Error al actualizar la calificación:", error);
    }
  };
  

  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString("es-ES", options);
  };

  const countByStatus = (status: string): number =>
    submissions.filter((s) => s.status === status).length;

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{assignment?.title} - Entregas</h1>
          <p className="text-gray-600">
            {assignment?.courseName} • {assignment?.teacherName}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            {countByStatus("graded")} Calificadas
          </Badge>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            {submissions.filter((s) => s.status !== "graded" && s.onTime).length} En tiempo
          </Badge>
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            {submissions.filter((s) => s.status !== "graded" && !s.onTime).length} Tarde
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Listado de entregas</span>
            {assignment?.delivery_date && (
              <div className="flex items-center text-sm">
                <Clock className="w-4 h-4 mr-1" />
                <span>
                  Fecha límite: {formatDate(assignment.delivery_date)}
                </span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {submissions.length > 0 ? (
            submissions.map((submission) => (
              <SubmissionItem
                key={submission.id}
                submission={submission}
                onGradeUpdate={handleGradeUpdate}
                formatDate={formatDate}
              />
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              No hay entregas registradas todavía.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
