import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useToast } from "@/hooks/use-toast";
import { Assignment, Comment, Submission, User, UserType } from "@/lib/types";
import { TeacherView } from "../components/TeacherView";
import { StudentView } from "../components/StudentView";

export function AssignmentDetailPage() {
  const { id } = useParams();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [comment, setComment] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [submissionUploaded, setSubmissionUploaded] = useState(false);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [userType, setUserType] = useState<UserType>("student");
  const [tempGrades, setTempGrades] = useState<Record<string, number | null>>({});
  const { toast } = useToast();

  useEffect(() => {
  const fetchAssignment = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found");
      return;
    }
    
    const decodedToken = jwtDecode(token) as { [key: string]: any };
    setUserType(decodedToken.type);   

    try {
      // Obtener datos de la tarea
      const response = await fetch(
        `https://edutalk-by8w.onrender.com/api/assignment/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const assignmentData = await response.json();
        setAssignment(assignmentData);

        // Si es profesor, obtener todas las entregas
        if (decodedToken.type === "teacher") {
          const submissionsResponse = await fetch(
            `https://edutalk-by8w.onrender.com/api/submission/assignment/${id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (submissionsResponse.ok) {
            const submissionsData = await submissionsResponse.json();
            
            // Enriquecer los datos con información de estudiantes y status
            const enrichedSubmissions = await Promise.all(
              submissionsData.map(async (sub: any) => {
                // Obtener información del estudiante (simulado ya que tu backend no lo provee)
                const studentInfo = await fetchStudentInfo(sub.student_id, token);
                
                // Determinar el status
                let status: 'pending' | 'submitted' | 'late' | 'graded' = 'submitted';
                if (sub.calification !== null) status = 'graded';
                else if (new Date(sub.createdAt) > new Date(assignmentData.delivery_date)) {
                  status = 'late';
                }

                return {
                  ...sub,
                  student: studentInfo,
                  status
                };
              })
            );
            
            setSubmissions(enrichedSubmissions);
          }
        }
        // Si es estudiante, obtener su entrega
        else {
          const submissionResponse = await fetch(
            `https://edutalk-by8w.onrender.com/api/submission/student/${decodedToken.id}/assignment/${id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (submissionResponse.ok) {
            const submissionData = await submissionResponse.json();
            if (submissionData) {
              let status: 'pending' | 'submitted' | 'late' | 'graded' = 'submitted';
              if (submissionData.calification !== null) status = 'graded';
              else if (new Date(submissionData.createdAt) > new Date(assignmentData.delivery_date)) {
                status = 'late';
              }

              setSubmission({
                ...submissionData,
                status
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  async function fetchStudentInfo(studentId: string, token: string): Promise<User | null> {
    try {
      const response = await fetch(
        `https://edutalk-by8w.onrender.com/api/student/${studentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error("Error fetching student info:", error);
      return null;
    }
  }
  
    if (id) fetchAssignment();
  }, [id, submissionUploaded]);

  const handleGradeUpdate = async (submissionId: string, newGrade: number | null) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `https://edutalk-by8w.onrender.com/api/submission/${submissionId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            grade: newGrade,  // Usar grade en lugar de calification
            status: newGrade !== null ? 'graded' : 'submitted'
          }),
        }
      );
  
      if (response.ok) {
        const updatedSubmission = await response.json();
        setSubmissions(prev => prev.map(sub => 
          sub.id === submissionId ? {
            ...sub,
            grade: updatedSubmission.grade,
            status: updatedSubmission.grade !== null ? 'graded' : 'submitted'
          } : sub
        ));
      }
    } catch (error) {
      console.error("Error updating grade:", error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast({
        title: "¡Advertencia!",
        description: "Selecciona un archivo para entregar la tarea",
      });
      return;
    }

    setUploading(true);
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const decodedToken = jwtDecode(token) as { id: string };
      // ... (mantener la lógica original de subida de archivos)
      setSubmissionUploaded(true);
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="flex gap-6">
      {userType === "teacher" ? (
        <TeacherView
          assignment={assignment}
          submissions={submissions}
          handleGradeUpdate={handleGradeUpdate}
          formatDate={formatDate}
        />
      ) : (
        <StudentView
          assignment={assignment}
          submission={submission}
          isLoading={isLoading}
          comments={comments}
          comment={comment}
          selectedFile={selectedFile}
          uploading={uploading}
          formatDate={formatDate}
          setComment={setComment}
          setSelectedFile={setSelectedFile}
          handleSubmit={handleSubmit}
        />
      )}
    </div>
  );
}