import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useToast } from "@/hooks/use-toast";
import { Assignment, Comment, Submission, User, UserType } from "@/lib/types";
import { TeacherView } from "../components/assignment/TeacherView";
import { StudentView } from "../components/assignment/StudentView";

export function AssignmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  // Estados principales
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [comment, setComment] = useState("");
  // Mantenemos el estado existente para compatibilidad con los componentes
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // Estado adicional para múltiples archivos (interno)
  const [selectedFilesInternal, setSelectedFilesInternal] = useState<File[]>([]);

  // Estados de carga
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submissionUploaded, setSubmissionUploaded] = useState(false);

  // Estados de usuario
  const [userType, setUserType] = useState<UserType>("student");
  const [tempGrades, setTempGrades] = useState<Record<string, number | null>>({});

  // Sincronizar el archivo seleccionado con la lista interna
  useEffect(() => {
    if (selectedFile) {
      setSelectedFilesInternal([selectedFile]);
    }
  }, [selectedFile]);

  const fetchComments = async (assignmentId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return [];
  
    try {
      const response = await fetch(
        `https://edutalk-by8w.onrender.com/api/comments/assignment/${assignmentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error obteniendo comentarios");
      }
  
      const data = await response.json();
      
      // Validación de estructura de datos
      if (!Array.isArray(data)) {
        throw new Error("Formato de comentarios inválido");
      }
  
      return data.map((comment: any) => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        Author: comment.Author ? {
          id: comment.Author.id,
          name: comment.Author.name
        } : null
      })) as Comment[];
      
    } catch (error) {
      console.error("Error obteniendo comentarios:", error);
      toast({
        title: "Error",
        description: error instanceof Error 
          ? error.message 
          : "Error al cargar comentarios",
        variant: "destructive",
      });
      return [];
    }
  };

  useEffect(() => {
    const fetchAssignment = async () => {
      const token = localStorage.getItem("token");
      if (!token || !id) return;

      const decodedToken = jwtDecode<{ [key: string]: any }>(token);
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
        const loadedComments = await fetchComments(id);
        setComments(loadedComments);

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
          // Student-specific fetch - AQUÍ ESTÁ LA CORRECCIÓN
          // Usamos la nueva ruta que incluye student_id y assignment_id
          const studentId = decodedToken.id;
          const submissionRes = await fetch(
            `https://edutalk-by8w.onrender.com/api/submission/student/${studentId}/assignment/${id}`,
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
        console.error("Error al cargar los datos:", error);
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
  }, [id, submissionUploaded, toast]);

  const handleCommentSubmit = async () => {
    if (!comment.trim()) {
      toast({
        title: "¡Atención!",
        description: "El comentario no puede estar vacío",
      });
      return;
    }
  
    const token = localStorage.getItem("token");
    if (!token || !id) return;
  
    // Declarar tempComment fuera del bloque try para que sea accesible en el catch
    let tempComment: Comment | null = null;
  
    try {
      const decodedToken = jwtDecode<{ id: string }>(token);
  
      // Crear objeto temporal para actualización optimista
      tempComment = {
        id: `temp-${Date.now()}`,
        content: comment.trim(),
        createdAt: new Date().toISOString(),
        Author: {
          id: decodedToken.id,
          name: "Tú"
        }
      };
  
      // Actualización optimista
      setComments(prev => [tempComment!, ...prev]);
      setComment("");
  
      const response = await fetch(
        "https://edutalk-by8w.onrender.com/api/comments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: comment.trim(),
            assignment_id: id,
            author_id: decodedToken.id,
          }),
        }
      );
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error en la respuesta del servidor");
      }
  
      // Refrescar comentarios
      if (id) { // Añadir validación adicional para id
        const updatedComments = await fetchComments(id);
        setComments(updatedComments);
      }
  
      toast({
        title: "¡Comentario publicado!",
        description: "Tu comentario se ha compartido con la clase",
      });
  
    } catch (error) {
      // Revertir actualización optimista solo si tempComment existe
      if (tempComment) {
        setComments(prev => prev.filter(c => c.id !== tempComment!.id));
      }
      
      console.error("Error submitting comment:", error);
      toast({
        title: "Error",
        description: error instanceof Error 
          ? error.message 
          : "No se pudo publicar el comentario",
        variant: "destructive",
      });
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

  // Función actualizada para enviar una sola URL compatible con el modelo
  const handleSubmit = async () => {
    // Usamos los archivos del estado interno o el archivo seleccionado individual
    const filesToUpload = selectedFilesInternal.length > 0 
      ? selectedFilesInternal 
      : (selectedFile ? [selectedFile] : []);

    if (filesToUpload.length === 0) {
      toast({
        title: "¡Advertencia!",
        description: "Selecciona al menos un archivo para entregar la tarea",
      });
      return;
    }

    setUploading(true);
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const signatureRes = await fetch(
        "https://edutalk-by8w.onrender.com/api/auth/get-signature",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!signatureRes.ok) throw new Error("Error al obtener la firma");
      const signatureData = await signatureRes.json();

      // Subir todos los archivos seleccionados a Cloudinary
      const uploadedFileUrls: string[] = [];
      for (const file of filesToUpload) {
        const formData = new FormData();
        formData.append("file", file);
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
        uploadedFileUrls.push(cloudinaryData.secure_url);
      }

      console.log(uploadedFileUrls);

      // Adaptación: Convertir el array de URLs a una única string
      // Opción 1: Usar solo la primera URL si hay varias
      const fileUrl = uploadedFileUrls[0];
      
      // Opción 2 (alternativa): Convertir el array a una cadena JSON
      // const fileUrl = JSON.stringify(uploadedFileUrls);

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
            file_url: fileUrl, // Enviamos solo una URL como string
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
      setSelectedFilesInternal([]);
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