import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

const routes: Record<string, string> = {
  "": "Inicio",
  chat: "Chat",
  cursos: "Cursos",
  tareas: "Tareas",
  calificaciones: "Calificaciones",
  calendario: "Calendario",
};

export function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);
  const [courseName, setCourseName] = useState<string>("");
  const [assignmentName, setAssignmentName] = useState<string>("");

  useEffect(() => {
    const fetchNames = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      // Si estamos en una ruta de clase
      if (pathnames[0] === "clases" && pathnames[1]) {
        try {
          const response = await fetch(
            `https://edutalk-by8w.onrender.com/api/course/${pathnames[1]}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (response.ok) {
            const data = await response.json();
            setCourseName(data.name);
          }
        } catch (error) {
          console.error("Error fetching course name:", error);
        }
      }

      // Si estamos en una ruta de tarea
      if (
        pathnames[0] === "tareas" &&
        pathnames[1] &&
        pathnames[2] !== "entregas"
      ) {
        try {
          const response = await fetch(
            `https://edutalk-by8w.onrender.com/api/assignment/${pathnames[1]}`,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (response.ok) {
            const data = await response.json();
            setAssignmentName(data.title);
          }
        } catch (error) {
          console.error("Error fetching assignment name:", error);
        }
      }
    };

    fetchNames();
  }, [pathnames]);

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600">
      <Link to="/" className="flex items-center hover:text-emerald-600">
        <Home className="w-4 h-4" />
      </Link>
      {pathnames.length > 0 && <ChevronRight className="w-4 h-4" />}
      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join("/")}`;
        const isLast = index === pathnames.length - 1;

        // Determinar qué texto mostrar
        let displayText = routes[value] || value;
        if (value === pathnames[1]) {
          if (pathnames[0] === "clases") {
            displayText = courseName || value;
          } else if (pathnames[0] === "tareas") {
            displayText = assignmentName || value;
          }
        }

        return (
          <div key={to} className="flex items-center">
            <Link
              to={to}
              className={`${
                isLast
                  ? "text-emerald-600 font-medium"
                  : "hover:text-emerald-600"
              }`}
            >
              {displayText}
            </Link>
            {!isLast && <ChevronRight className="w-4 h-4 ml-2" />}
          </div>
        );
      })}
    </nav>
  );
}
