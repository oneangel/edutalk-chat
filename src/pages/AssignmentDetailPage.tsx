import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useToast } from "@/hooks/use-toast";
import { Assignment, Comment, Submission, User, UserType } from "@/lib/types";
import { TeacherView } from "../components/assignment/TeacherView";
import { StudentView } from "../components/assignment/StudentView";

export function AssignmentDetailPage() {
  const { id } = useParams();
  const { toast } = useToast();

  // Estados principales
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [comment, setComment] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Estados de carga
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submissionUploaded, setSubmissionUploaded] = useState(false);

  // Estados de usuario
  const [userType, setUserType] = useState<UserType>("student");
  const [tempGrades, setTempGrades] = useState<Record<string, number | null>>(
    {}
  );

  useEffect(() => {
    const fetchAssignment = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      const decodedToken = jwtDecode(token) as { [key: string]: any };
      setUserType(decodedToken.type);

      try {
        // Fetch assignment data
        const assignmentRes = await fetch(
          `https://edutalk-by8w.onrender.com/api/assignment/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!assignmentRes.ok) throw new Error("Error fetching assignment");
        const assignmentData = await assignmentRes.json();
        setAssignment(assignmentData);

        // Fetch comments
        const commentsRes = await fetch(
          `https://edutalk-by8w.onrender.com/api/assignment/${id}/comments`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (commentsRes.ok) {
          setComments(await commentsRes.json());
        }

        // Teacher-specific fetches
        if (decodedToken.type === "teacher") {
          const submissionsRes = await fetch(
            `https://edutalk-by8w.onrender.com/api/assignment/${id}/submissions`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (submissionsRes.ok) {
            const submissionsData = await submissionsRes.json();
            const enrichedSubmissions = await Promise.all(
              submissionsData.map(async (sub: any) => {
                const studentInfo = await fetchStudentInfo(
                  sub.student_id,
                  token
                );
                const status = getSubmissionStatus(
                  sub,
                  assignmentData.delivery_date
                );
                return { ...sub, student: studentInfo, status };
              })
            );
            setSubmissions(enrichedSubmissions);
          }
        } else {
          // Student-specific fetch
          const submissionRes = await fetch(
            `https://edutalk-by8w.onrender.com/api/assignment/${id}/submission`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (submissionRes.ok) {
            const submissionData = await submissionRes.json();
            if (submissionData) {
              setSubmission({
                ...submissionData,
                status: getSubmissionStatus(
                  submissionData,
                  assignmentData.delivery_date
                ),
              });
            }
          }
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Error al cargar los datos",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    const getSubmissionStatus = (sub: any, deliveryDate: string) => {
      if (sub.calification !== null) return "revisado";
      if (new Date(sub.createdAt) > new Date(deliveryDate)) return "tarde";
      return "entregado";
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case "entregado":
          return "bg-emerald-100 text-emerald-700";
        case "tarde":
          return "bg-amber-100 text-amber-700";
        case "revisado":
          return "bg-blue-100 text-blue-700";
        default:
          return "bg-gray-100 text-gray-700";
      }
    };

    const getStatusText = (status: string) => {
      switch (status) {
        case "entregado":
          return "Entregado";
        case "tarde":
          return "Entregado tarde";
        case "revisado":
          return "Revisado";
        default:
          return "Pendiente";
      }
    };

    const fetchStudentInfo = async (
      studentId: string,
      token: string
    ): Promise<User | null> => {
      try {
        const res = await fetch(
          `https://edutalk-by8w.onrender.com/api/student/${studentId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.ok ? await res.json() : null;
      } catch (error) {
        console.error("Error fetching student info:", error);
        return null;
      }
    };

    if (id) fetchAssignment();
  }, [id, submissionUploaded]);

  // Función para enviar comentarios
  const handleCommentSubmit = async () => {
    if (!comment.trim()) return;

    const token = localStorage.getItem("token");
    if (!token || !id) return;

    try {
      const decodedToken = jwtDecode(token) as {
        id: string;
        name: string;
        avatar?: string;
      };

      const response = await fetch(
        "https://edutalk-by8w.onrender.com/api/comments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            assignmentId: id,
            content: comment.trim(),
            authorId: decodedToken.id,
          }),
        }
      );

      if (response.ok) {
        const newComment = await response.json();
        setComments((prev) => [
          ...prev,
          {
            ...newComment,
            author: decodedToken.name,
            avatar: decodedToken.avatar || "https://i.pravatar.cc/150?img=3",
          },
        ]);
        setComment("");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al publicar el comentario",
        variant: "destructive",
      });
    }
  };

  // Función para formatear fechas
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Resto de funciones existentes (handleGradeUpdate, handleSubmit)
  const handleGradeUpdate = async (
    submissionId: string,
    newGrade: number | null
  ) => {
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
          body: JSON.stringify({ grade: newGrade }),
        }
      );

      if (response.ok) {
        const updated = await response.json();
        setSubmissions((prev) =>
          prev.map((sub) =>
            sub.id === submissionId
              ? { ...sub, grade: updated.grade, status: "graded" }
              : sub
          )
        );
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
      // 1. Obtener la firma para Cloudinary
      const signatureRes = await fetch(
        "https://edutalk-by8w.onrender.com/api/auth/get-signature",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!signatureRes.ok) throw new Error("Error al obtener la firma");
      const signatureData = await signatureRes.json();

      // 2. Subir el archivo a Cloudinary
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("api_key", "965141632148366");
      formData.append("timestamp", signatureData.timestamp);
      formData.append("signature", signatureData.signature);
      formData.append("folder", "tareas");

      const cloudinaryRes = await fetch(
        `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/raw/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!cloudinaryRes.ok) throw new Error("Error al subir el archivo");
      const cloudinaryData = await cloudinaryRes.json();

      // 3. Crear la entrega
      const decodedToken = jwtDecode(token) as { id: string };
      const submissionRes = await fetch(
        "https://edutalk-by8w.onrender.com/api/submission",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            student_id: decodedToken.id,
            assignment_id: id,
            file_url: cloudinaryData.secure_url,
          }),
        }
      );

      if (!submissionRes.ok) throw new Error("Error al crear la entrega");

      toast({
        title: "¡Éxito!",
        description: "Tu tarea ha sido entregada correctamente",
      });

      setSubmissionUploaded(true);
      setSelectedFile(null);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Hubo un error al entregar la tarea",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex gap-6">
      {userType === "teacher" ? (
        <TeacherView
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
          onCommentSubmit={handleCommentSubmit}
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
          onCommentSubmit={handleCommentSubmit}
        />
      )}
    </div>
  );
}
