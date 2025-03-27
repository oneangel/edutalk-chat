import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Clock,
  Upload,
  MessageSquare,
  Paperclip,
  XCircle,
} from "lucide-react";
import { jwtDecode } from "jwt-decode";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  avatar: string;
}

interface Assignment {
  id: string;
  title: string;
  course_id: string;
  delivery_date: string;
  status: boolean;
  description: string;
  courseName: string;
  teacherName: string;
}

interface Submission {
  id: string;
  student_id: string;
  file_url: string;
  grade: number | null;
  createdAt: string;
}

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
  const [submission, setSubmission] = useState<any>(null);
  const [url, setUrl] = useState("");
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [userType, setUserType] = useState<"student" | "teacher">("student");
  const [tempGrades, setTempGrades] = useState<Record<string, number | null>>({});
    
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
          const data = await response.json();
          setAssignment(data);
  
          // Si es profesor, obtener todas las entregas
          if (decodedToken.type === "teacher") {
            const submissionsResponse = await fetch(
              `https://edutalk-by8w.onrender.com/api/submission/assignment/${id}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (submissionsResponse.ok) {
              const submissionsData = await submissionsResponse.json();
              setSubmissions(submissionsData);
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
              setSubmission(submissionData);
              setUrl(submissionData?.file_url || "");
            }
          }
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };
  
    if (id) fetchAssignment();
  }, [id, submissionUploaded]);
  
  // USE EFFECT PA PROBAR
  useEffect(() => {
    if (process.env.NODE_ENV === "development" && userType === "teacher") {
      // Datos de prueba para submissions
      const mockSubmissions: Submission[] = [
        {
          id: "sub-test-1",
          student_id: "estudiante-001",
          file_url: "https://example.com/entrega1.pdf",
          grade: null,
          createdAt: new Date().toISOString()
        },
        {
          id: "sub-test-2",
          student_id: "estudiante-002",
          file_url: "https://example.com/entrega2.pdf",
          grade: 85,
          createdAt: new Date().toISOString()
        }
      ];
      
      // Actualizar el estado solo si no hay submissions reales
      if (submissions.length === 0) {
        setSubmissions(mockSubmissions);
      }
    }
  }, [userType]);

  useEffect(() => {
    if (userType === "teacher" && submissions.length > 0) {
      const initialTempGrades = submissions.reduce((acc: Record<string, number | null>, sub) => {
        acc[sub.id] = sub.grade !== null ? sub.grade : null;
        return acc;
      }, {});
      setTempGrades(initialTempGrades);
    }
  }, [submissions, userType]);

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
          body: JSON.stringify({ grade: newGrade }), // Asegúrate que sea 'grade'
        }
      );
  
      if (response.ok) {
        // Actualizar estado local
        setSubmissions(prev => prev.map(sub => 
          sub.id === submissionId ? { ...sub, grade: newGrade } : sub
        ));
        
        // Sincronizar tempGrades
        setTempGrades(prev => ({
          ...prev,
          [submissionId]: newGrade
        }));
      }
    } catch (error) {
      // Manejo de errores
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return toast({
        title: "¡Advertencia!",
        description: "Selecciona un archivo para entregar la tarea",
        duration: 5000,
      });

    setUploading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found");
      return;
    }

    const decodedToken = jwtDecode(token) as { [key: string]: any };
    const student_id = decodedToken.id;

    try {
      const response = await fetch(
        "https://edutalk-by8w.onrender.com/api/auth/get-signature",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("api_key", "965141632148366");
      formData.append("timestamp", data.timestamp);
      formData.append("signature", data.signature);
      formData.append("folder", "tareas");

      const cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${data.cloudName}/raw/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const cloudinaryData = await cloudinaryResponse.json();
      
      setUploadedUrl(cloudinaryData.secure_url);
      const submissionResponse = await fetch(
        "https://edutalk-by8w.onrender.com/api/submission",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            student_id, // student_id obtenido del token
            assignment_id: id, // assignment_id es el id de la tarea
            file_url: cloudinaryData.secure_url, // URL del archivo subido
          }),
        }
      );

      if (submissionResponse.ok) {
        toast({
          title: "¡Exito!",
          description: "Tarea entregada con éxito",
          duration: 5000,
        });
        setSubmissionUploaded(true);
      } else {
        console.error("Error al crear la entrega");
        toast({
          title: "¡Error!",
          description: "Error al entregar la tarea",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Error subiendo archivo:", error);
      toast({
        title: "¡Error!",
        description: "Error al subir el archivo",
        duration: 5000,
      });
    }

    setUploading(false);
  };

  const handleComment = () => {
    if (comment.trim()) {
      console.log("New comment:", comment);
      setComment("");
    }
  };

  // Función para eliminar el archivo seleccionado
  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "tarea.pdf"; // Nombre del archivo
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error al descargar el archivo:", error);
    }
  };

  return (
    <div className="flex gap-6">
    {userType === "teacher" ? (
      // VISTA PROFESOR
      <div className="flex-1 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {assignment?.title} - Entregas
            </h1>
            <p className="text-gray-600">
              {assignment?.courseName} • {assignment?.teacherName}
            </p>
          </div>
          <Badge className="bg-blue-100 text-blue-800">
            {submissions.length} entregas
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Calificar Estudiantes</CardTitle>
          </CardHeader>
          <CardContent>
            {submissions.map((sub) => (
              <div 
                key={sub.id}
                className="flex items-center justify-between p-4 mb-2 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">Estudiante {sub.student_id}</span>
                  <a 
                    href={sub.file_url} 
                    target="_blank"
                    className="text-blue-600 flex items-center"
                  >
                    <Paperclip className="mr-1 w-4 h-4"/>
                    Ver entrega
                  </a>
                </div>
                
                <div className="flex items-center gap-2 w-80">
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      type="number"
                      value={tempGrades[sub.id] ?? sub.grade ?? ""}
                      onChange={(e) => {
                        const value = e.target.value === "" ? null : Number(e.target.value);
                        setTempGrades(prev => ({ ...prev, [sub.id]: value }));
                      }}
                      min="0"
                      max="100"
                      className="w-24"
                    />
                    <span className="text-gray-500">/100</span>
                  </div>
                  <Button 
                    onClick={() => sub.id && handleGradeUpdate(sub.id, tempGrades[sub.id] ?? null)}
                    disabled={
                      tempGrades[sub.id] === sub.grade ||
                      (tempGrades[sub.id] === null && sub.grade === null)
                    }
                    size="sm"
                    className="ml-2 transition-all"
                    variant={
                      tempGrades[sub.id] !== sub.grade ? "default" : "outline"
                    }
                  >
                    {tempGrades[sub.id] === sub.grade ? "✓" : "Actualizar"}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    ) : (
        /* Vista para Estudiante */
        <>
          {/* Left side - Assignment details and comments */}
          <div className="flex-1 space-y-6">
            {isLoading ? (
              <p>Cargando detalles de la tarea...</p>
            ) : assignment ? (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {assignment.title}
                    </h1>
                    <p className="text-gray-600">
                      {assignment.courseName} • {assignment.teacherName}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-yellow-800 bg-yellow-100"
                  >
                    {!assignment.status ? "Pendiente" : "Entregado"}
                  </Badge>
                </div>
  
                <Card>
                  <CardHeader>
                    <CardTitle>Detalles de la tarea</CardTitle>
                    <CardDescription>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>Fecha de entrega:</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>{formatDate(assignment.delivery_date)}</span>
                        </div>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      <pre className="font-sans whitespace-pre-wrap">
                        {assignment.description}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
  
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Comentarios de la clase
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex space-x-2">
                        <Textarea
                          placeholder="Añadir un comentario..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                        />
                        <Button onClick={handleComment}>Comentar</Button>
                      </div>
                      <Separator />
                      <div className="space-y-4">
                        {comments.map((comment) => (
                          <div key={comment.id} className="flex space-x-3">
                            <img
                              src={comment.avatar}
                              alt={comment.author}
                              className="w-8 h-8 rounded-full"
                            />
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">
                                  {comment.author}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {formatDate(comment.timestamp)}
                                </span>
                              </div>
                              <p className="mt-1 text-gray-600">
                                {comment.content}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <p>Error al cargar la tarea</p>
            )}
          </div>
  
          {/* Right side - File upload */}
          <div className="w-80">
            <div className="sticky top-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tu entrega</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {submission && submission.file_url ? (
                      <div className="flex items-center p-2 text-sm text-gray-600 rounded bg-gray-50">
                        <Paperclip className="flex-shrink-0 w-4 h-4 mr-1" />
                        <a href={url}>Descargar</a>
                      </div>
                    ) : (
                      <>
                        <input
                          type="file"
                          id="file-upload"
                          className="hidden"
                          onChange={handleFileChange}
                          accept=".pdf,.doc,.docx"
                        />
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() =>
                            document.getElementById("file-upload")?.click()
                          }
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Seleccionar archivo
                        </Button>
                        {selectedFile && (
                          <div className="flex items-center p-2 text-sm text-gray-600 rounded bg-gray-50">
                            <Paperclip className="flex-shrink-0 w-4 h-4 mr-1" />
                            <span className="truncate">{selectedFile.name}</span>
                            <button
                              onClick={handleRemoveFile}
                              className="ml-2 text-red-500"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </>
                    )}
  
                    <Button
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      onClick={handleSubmit}
                      disabled={uploading || submission?.status}
                    >
                      {uploading ? "Subiendo..." : submission?.status ? "Tarea entregada" : "Entregar tarea"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
