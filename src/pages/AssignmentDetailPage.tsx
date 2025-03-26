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

  useEffect(() => {
    const fetchAssignment = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        return;
      }
      const decodedToken = jwtDecode(token) as { [key: string]: any };
      const student_id = decodedToken.id;

      try {
        const response = await fetch(
          `https://edutalk-by8w.onrender.com/api/assignment/${id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setAssignment(data);

            const submissionResponse = await fetch(
              `https://edutalk-by8w.onrender.com/api/submission/student/${student_id}/assignment/${id}`,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (submissionResponse.ok) {
              const submissionData = await submissionResponse.json();
              setSubmission(submissionData);
              setUrl(submissionData.file_url);
          }
        } else {
          console.error("Error al obtener la tarea");
        }
      } catch (error) {
        console.error("Error en la solicitud:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchAssignment();
    }
  }, [id, submissionUploaded]);

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
          {/* Mostrar el archivo adjunto si la tarea fue entregada */}
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

    </div>
  );
}
