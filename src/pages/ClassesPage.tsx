import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ClipboardList } from "lucide-react";
import { jwtDecode } from "jwt-decode";

interface Assignment {
  id: string;
  course_id: string;
  title: string;
  description: string;
  createdAt: string;
  delivery_date: string;
  status: true | false;
}

interface Course {
  id: string;
  name: string;
  description: string;
  teacher_id: string;
  code: string;
  status: boolean;
  createdAt: string;
  assignments: Assignment[];
}

export function ClassesPage() {
  const [className, setClassName] = useState<string>("");
  const [classDescription, setClassDescription] = useState<string>("");
  const [classCode, setClassCode] = useState("");
  const [classes, setClasses] = useState<Course[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const navigate = useNavigate();
  const [userType, setUserType] = useState("");

  // Función para obtener las clases
  // Función para obtener las clases (ajustada para maestros)
  const fetchClasses = async () => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      console.error("No token found");
      return;
    }

    try {
      const decodedToken = jwtDecode(storedToken) as { [key: string]: any };
      const userId = decodedToken.id;
      const userType = decodedToken.type;

      let response;
      if (userType === "teacher") {
        // Si es un maestro, obtener cursos de ese maestro
        response = await fetch(
          `https://edutalk-by8w.onrender.com/api/course/teacher/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          }
        );
      } else if (userType === "student") {
        // Si es un estudiante, obtener cursos del estudiante
        response = await fetch(
          `https://edutalk-by8w.onrender.com/api/course/student/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          }
        );
      }

      if (!response) {
        throw new Error("Failed to fetch classes: response is undefined.");
      }
      const data = await response.json();

      const mappedClasses = data.map((course: any) => ({
        id: course.id,
        name: course.name,
        description: course.description,
        code: course.code,
        teacher_id: course.teacher_id,
        status: course.status,
        createdAt: course.createdAt,
        assignments: course.assignments || [],
      }));

      setClasses(mappedClasses);
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  // useEffect para obtener las clases al cargar la página
  useEffect(() => {
    fetchClasses();
  }, []);

  const generateRandomCode = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      code += characters[randomIndex];
    }
    return code;
  };

  const handleCreateClass = async () => {
    if (!className || !classDescription || !userId) {
      console.log("Por favor llena todos los campos.");
      return;
    }

    setLoading(true);

    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No se ha encontrado el token de autenticación.");
      setLoading(false);
      return;
    }

    // Si no se proporciona un código, generar uno automáticamente
    const generatedClassCode = classCode || generateRandomCode();

    try {
      const response = await fetch(
        "https://edutalk-by8w.onrender.com/api/course",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: className,
            description: classDescription,
            code: generatedClassCode,
            teacher_id: userId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo crear la clase.");
      }

      console.log("Clase creada con éxito.");
      setClassName("");
      setClassDescription("");
      setClassCode("");
      // Recargar las clases después de crear
      await fetchClasses(); // Asegúrate de tener esta función para obtener las clases.
    } catch (error: any) {
      console.log(error.message || "Ocurrió un error.");
    } finally {
      setLoading(false);
    }
  };

  // Función para unirse a una clase
  const handleJoinClass = async () => {
    if (!classCode) {
      console.log("Ingresa el código de la clase");
      return;
    }
    setLoading(true);

    const token = localStorage.getItem("token");

    if (!token) {
      console.log("No se ha encontrado el token de autenticación.");
      setLoading(false);
      return;
    }

    try {
      const decodedToken = jwtDecode(token) as { [key: string]: any };
      const studentId = decodedToken.id;

      const response = await fetch(
        "https://edutalk-by8w.onrender.com/api/enrollment/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            student_id: studentId,
            course_code: classCode,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo unir a la clase.");
      }

      console.log("Te has unido a la clase con éxito.");
      // Recargar las clases después de unirse
      await fetchClasses(); // Llama a fetchClasses para actualizar las clases
      setClassCode(""); // Limpia el campo del código de clase
    } catch (error: any) {
      console.log(error.message || "Ocurrió un error.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Assignment["status"]) => {
    return status ? "bg-gray-100 text-gray-800" : "bg-green-100 text-green-800";
  };

  const getStatusText = (status: Assignment["status"]) => {
    return status ? "Pendiente" : "Entregado";
  };

  // useEffect para obtener las clases al cargar la página
  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      console.error("No token found");
      return;
    }

    try {
      // Decodifica el token
      const decodedToken = jwtDecode(storedToken) as { [key: string]: any };
      setUserType(decodedToken.type);
      setUserId(decodedToken.id);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Mis Clases</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              {userType === "student"
                ? "Unirse a una clase"
                : "Crear una clase"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {userType === "student"
                  ? "Unirse a una clase"
                  : "Crear una clase"}
              </DialogTitle>
              <DialogDescription>
                {userType === "student"
                  ? "Ingresa el código de la clase proporcionado por tu profesor"
                  : "Ingresa los datos de la clase que deseas crear"}
              </DialogDescription>
            </DialogHeader>
            {userType === "teacher" ? (
              <div className="mt-4 space-y-4">
                <Input
                  placeholder="Nombre de la clase"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  disabled={loading}
                />
                <Input
                  placeholder="Descripción de la clase"
                  value={classDescription}
                  onChange={(e) => setClassDescription(e.target.value)}
                  disabled={loading}
                />
                <Button
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  onClick={handleCreateClass}
                  disabled={loading}
                >
                  {loading ? "Creando..." : "Crear"}
                </Button>
              </div>
            ) : (
              <>
                <div className="mt-4 space-y-4">
                  <Input
                    placeholder="Código de la clase"
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value)}
                    disabled={loading}
                  />
                  <Button
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    onClick={handleJoinClass}
                    disabled={loading}
                  >
                    {loading ? "Uniéndose..." : "Unirse"}
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {classes.length === 0 ? (
        <p className="text-center text-gray-500">
          {userType === "teacher"
            ? "No has creado ninguna clase aún."
            : "No has sido inscrito en ninguna clase aún."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((classItem) => (
            <Card
              key={classItem.id}
              className="overflow-hidden transition-shadow hover:shadow-lg"
              onClick={() => {
                navigate(`/clases/${classItem.id}`);
              }}
            >
              <div className="relative bg-black text-white text-3xl font-bold flex items-center justify-center h-40 rounded-lg">
                {classItem.name}
              </div>
              <CardHeader>
                <CardTitle className="text-xl">
                  {classItem.description}
                </CardTitle>
                <CardDescription>
                  Codigo de la clase: {classItem.code}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
