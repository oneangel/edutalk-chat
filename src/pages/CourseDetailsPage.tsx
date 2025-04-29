import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, Paperclip, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

interface Assignment {
  id: string;
  title: string;
  description: string;
  delivery_date: string;
  status: boolean;
  file_url: string[];
  assignment_type: 'file' | 'quiz';
  quiz_id?: string;
}

interface Course {
  id: string;
  name: string;
  description: string;
  code: string;
  assignments: Assignment[];
}

export function CourseDetailsPage() {
  const [course, setCourse] = useState<Course | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [assignmentTitle, setAssignmentTitle] = useState<string>("");
  const [assignmentDescription, setAssignmentDescription] =
    useState<string>("");
  const [deliveryDate, setDeliveryDate] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]); // Cambiado a array
  const navigate = useNavigate();
  const [userType, setUserType] = useState("");
  const [assignmentType, setAssignmentType] = useState<'file' | 'quiz'>('file');

  useEffect(() => {
    const fetchCourseAndAssignments = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found");
          return;
        }

        const decodedToken = jwtDecode(token) as { [key: string]: any };
        const userType = decodedToken.type;
        setUserType(userType);

        // 1. Obtener información del curso
        const courseResponse = await fetch(
          `https://edutalk-by8w.onrender.com/api/course/${id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!courseResponse.ok) {
          throw new Error("Error al obtener la información del curso");
        }

        const courseData = await courseResponse.json();

        // Setea el curso sin tareas aún
        setCourse({
          id: id!,
          name: courseData.name,
          description: courseData.description || "",
          code: courseData.code || "",
          assignments: [],
        });

        // 2. Obtener tareas del curso
        const assignmentsResponse = await fetch(
          `https://edutalk-by8w.onrender.com/api/assignment/course/${id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!assignmentsResponse.ok) {
          throw new Error("Error al obtener las tareas del curso");
        }

        const assignmentsData = await assignmentsResponse.json();

        // Actualiza el estado del curso con las tareas
        setCourse((prevCourse) => ({
          ...prevCourse!,
          assignments: assignmentsData,
        }));
      } catch (error) {
        console.error(error);
      }
    };

    if (id) {
      fetchCourseAndAssignments();
    }
  }, [id]);

  const handleCreateAssignment = async () => {
    if (!assignmentTitle || !assignmentDescription || !deliveryDate) {
      alert("Por favor, completa todos los campos.");
      return;
    }

    if (assignmentType === 'file' && selectedFiles.length === 0) {
      alert("Por favor, selecciona al menos un archivo.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found");
      return;
    }

    setLoading(true);

    try {
      if (assignmentType === 'file') {
        const signature = await fetch(
          "https://edutalk-by8w.onrender.com/api/auth/get-signature",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await signature.json();

        // Subir todos los archivos seleccionados a Cloudinary
        const uploadedFileUrls: string[] = [];
        for (const file of selectedFiles) {
          const formData = new FormData();
          formData.append("file", file);
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
          uploadedFileUrls.push(cloudinaryData.secure_url);
        }

        // Crear la tarea con las URLs de los archivos
        const response = await fetch(
          "https://edutalk-by8w.onrender.com/api/assignment",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              title: assignmentTitle,
              description: assignmentDescription,
              course_id: id,
              delivery_date: deliveryDate,
              file_url: uploadedFileUrls,
              assignment_type: 'file',
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Error al crear la tarea");
        }

        const newAssignment = await response.json();
        setCourse((prevCourse) =>
          prevCourse
            ? {
                ...prevCourse,
                assignments: [...prevCourse.assignments, newAssignment],
              }
            : prevCourse
        );
      }

      // Restablecer valores del formulario y cerrar el modal
      setAssignmentTitle("");
      setAssignmentDescription("");
      setDeliveryDate("");
      setSelectedFiles([]);
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
      alert("Hubo un error al crear la tarea.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setSelectedFiles((prevFiles) => [...prevFiles, ...Array.from(files)]);
    }
  };

  const handleRemoveFile = (fileName: string) => {
    setSelectedFiles((prevFiles) =>
      prevFiles.filter((file) => file.name !== fileName)
    );
  };

  if (!course)
    return (
      <p className="mt-10 text-center">Cargando detalles de la clase...</p>
    );

  return (
    <div className="max-w-4xl p-6 mx-auto space-y-6">
      {/* Encabezado */}
      <div className="relative flex items-center justify-center h-40 text-3xl font-bold text-white bg-black rounded-lg shadow-md">
        {course.name}
      </div>

      {/* Información de la clase */}
      <div className="p-4 bg-white rounded-lg shadow-md">
        <p className="text-gray-600">{course.description}</p>
        <p className="mt-2 text-sm text-gray-500">
          Código de la clase:{" "}
          <span className="font-semibold">{course.code}</span>
        </p>
      </div>

      {/* Modal para escribir la publicación */}
      {userType === "teacher" && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <div className="flex items-center p-4 space-x-2 bg-white rounded-lg shadow-md cursor-pointer hover:bg-gray-100">
              <p className="text-gray-500">Anuncia algo a la clase</p>
            </div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Publicación</DialogTitle>
              <DialogDescription>
                Asigna una tarea o publica algo interesante para la clase.
              </DialogDescription>
            </DialogHeader>
            <div className="flex mb-4 space-x-4">
              <Button
                variant={assignmentType === 'file' ? 'default' : 'outline'}
                onClick={() => setAssignmentType('file')}
                className="flex-1"
              >
                Tarea Normal
              </Button>
              <Button
                variant={assignmentType === 'quiz' ? 'default' : 'outline'}
                onClick={() => setAssignmentType('quiz')}
                className="flex-1"
              >
                Formulario
              </Button>
            </div>
            <Input
              placeholder="Título de la tarea"
              value={assignmentTitle}
              onChange={(e) => setAssignmentTitle(e.target.value)}
              disabled={loading}
            />
            <Input
              placeholder="Descripción de la clase"
              value={assignmentDescription}
              onChange={(e) => setAssignmentDescription(e.target.value)}
              disabled={loading}
            />
            <Input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              disabled={loading}
            />
            {assignmentType === 'file' ? (
              <>
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                  multiple
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => document.getElementById("file-upload")?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Seleccionar archivos
                </Button>

                {/* Mostrar los archivos seleccionados */}
                <div className="mt-4 space-y-2">
                  {selectedFiles.map((file) => (
                    <div
                      key={file.name}
                      className="flex items-center p-2 text-sm text-gray-600 rounded bg-gray-50"
                    >
                      <Paperclip className="flex-shrink-0 w-4 h-4 mr-1" />
                      <span className="truncate">{file.name}</span>
                      <button
                        onClick={() => handleRemoveFile(file.name)}
                        className="ml-2 text-red-500"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/quizzes/create?course_id=${id}`)}
              >
                Crear Formulario
              </Button>
            )}

            <div className="flex justify-end mt-4 space-x-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                onClick={handleCreateAssignment}
              >
                {loading ? "Creando..." : "Crear"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Lista de tareas/publicaciones */}
      {course.assignments.length > 0 ? (
        course.assignments.map((assignment) => (
          <div
            key={assignment.id}
            className="p-4 bg-white rounded-lg shadow-md cursor-pointer hover:bg-gray-50"
            onClick={() => {
              navigate(
                userType === "teacher"
                  ? `/tareas/${assignment.id}/entregas`
                  : `/tareas/${assignment.id}`
              );
            }}
          >
            <div className="py-2 border-b">
              <h3 className="text-lg font-semibold">{assignment.title}</h3>
              <p className="text-gray-600">{assignment.description}</p>
              <p className="mt-1 text-sm text-gray-500">
                Fecha de entrega:{" "}
                <span className="font-semibold">
                  {new Date(assignment.delivery_date).toLocaleDateString()}
                </span>
              </p>
              <p
                className={`text-sm font-semibold mt-2 ${
                  assignment.status ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {assignment.status ? "Activo" : "Inactivo"}
              </p>

              {assignment.file_url && assignment.file_url.length > 0 && (
                <>
                  {assignment.file_url.map((url, index) => (
                    <div
                      key={`file-${assignment.id}-${index}`} // Key única aquí
                      className="flex items-center p-2 text-sm text-gray-600 rounded bg-gray-50"
                    >
                      <Paperclip className="flex-shrink-0 w-4 h-4 mr-1" />
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        Archivo {index + 1}
                      </a>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="p-4 bg-white rounded-lg shadow-md">
          <p className="text-gray-500">No hay publicaciones aún.</p>
        </div>
      )}
    </div>
  );
}
