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

interface Assignment {
  id: string;
  title: string;
  description: string;
  delivery_date: string;
  status: boolean;
  file_url: string[];
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

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const token = localStorage.getItem("token"); // Se asume que el token se almacena en localStorage
        const response = await fetch(
          `https://edutalk-by8w.onrender.com/api/assignment/course/${id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Error al obtener las tareas");
        }

        const assignments = await response.json();
        setCourse({
          id: id!,
          name: "Matemáticas Avanzadas", // Esto debería venir del backend si la API lo soporta
          description: "Curso sobre cálculo y álgebra avanzada.",
          code: "MAT-2024",
          assignments,
        });
      } catch (error) {
        console.error(error);
      }
    };

    fetchAssignments();
  }, [id]);

  const handleCreateAssignment = async () => {
    if (!assignmentTitle || !assignmentDescription || !deliveryDate) {
      alert("Por favor, completa todos los campos.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found");
      return;
    }

    setLoading(true);

    try {
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
        uploadedFileUrls.push(cloudinaryData.secure_url); // Guarda la URL del archivo
      }

      //Imprimir las url del arreglo
      console.log(uploadedFileUrls);

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
          }),
        }
      );

      if (!response.ok) {
        console.log(response.json());

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
      <p className="text-center mt-10">Cargando detalles de la clase...</p>
    );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="relative bg-black text-white text-3xl font-bold flex items-center justify-center h-40 rounded-lg shadow-md">
        {course.name}
        <button className="absolute top-4 right-4 text-sm bg-gray-700 hover:bg-gray-600 text-white py-1 px-3 rounded">
          Personalizar
        </button>
      </div>

      {/* Información de la clase */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <p className="text-gray-600">{course.description}</p>
        <p className="mt-2 text-sm text-gray-500">
          Código de la clase:{" "}
          <span className="font-semibold">{course.code}</span>
        </p>
      </div>

      {/* Modal para escribir la publicación */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <div className="bg-white p-4 rounded-lg shadow-md flex items-center space-x-2 cursor-pointer hover:bg-gray-100">
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
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx"
            multiple // Habilitar selección múltiple
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
          <div className="space-y-2 mt-4">
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

          <div className="flex justify-end space-x-2 mt-4">
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

      {/* Lista de tareas/publicaciones */}
      {course.assignments.length > 0 ? (
        course.assignments.map((assignment) => (
          <div
            key={assignment.id}
            className="bg-white p-4 rounded-lg shadow-md cursor-pointer hover:bg-gray-50"
            onClick={() => navigate(`/tareas/${assignment.id}`)} // Esta línea corregida
          >
            <div className="border-b py-2">
              <h3 className="font-semibold text-lg">{assignment.title}</h3>
              <p className="text-gray-600">{assignment.description}</p>
              <p className="text-sm text-gray-500 mt-1">
                Fecha de entrega:{" "}
                <span className="font-semibold">
                  {new Date(assignment.delivery_date).toLocaleDateString()}
                </span>
              </p>
              <p
                className={`text-sm font-semibold mt-2 ${
                  assignment.status ? "text-green-600" : "text-red-600"
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
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-gray-500">No hay publicaciones aún.</p>
        </div>
      )}
    </div>
  );
}
