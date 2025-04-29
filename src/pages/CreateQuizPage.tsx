import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { jwtDecode } from "jwt-decode";

interface Question {
  question_text: string;
  type: "multiple_choice" | "open_ended";
  options?: string[];
  correct_answer: string;
}

export function CreateQuizPage() {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get("course_id");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([
    {
      question_text: "",
      type: "multiple_choice",
      options: ["", "", "", ""],
      correct_answer: "",
    },
  ]);

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: "",
        type: "multiple_choice",
        options: ["", "", "", ""],
        correct_answer: "",
      },
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index: number, field: keyof Question, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const handleOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
    const newQuestions = [...questions];
    if (!newQuestions[questionIndex].options) {
      newQuestions[questionIndex].options = ["", "", "", ""];
    }
    newQuestions[questionIndex].options![optionIndex] = value;
    setQuestions(newQuestions);
  };

  const handleSubmit = async () => {
    if (!title || questions.some(q => !q.question_text || !q.correct_answer)) {
      alert("Por favor, completa todos los campos requeridos.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found");
      return;
    }

    setLoading(true);

    try {
      // 1. Create the quiz
      const quizResponse = await fetch("https://edutalk-by8w.onrender.com/api/quizzes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          class_id: courseId,
          questions,
          feedback_enabled: true,
        }),
      });

      if (!quizResponse.ok) {
        throw new Error("Error al crear el quiz");
      }

      const quizData = await quizResponse.json();

      // 2. Create the assignment
      const assignmentResponse = await fetch("https://edutalk-by8w.onrender.com/api/assignment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description: "Formulario de evaluación",
          course_id: courseId,
          delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
          assignment_type: "quiz",
          quiz_id: quizData.id,
        }),
      });

      if (!assignmentResponse.ok) {
        throw new Error("Error al crear la tarea");
      }

      navigate(`/courses/${courseId}`);
    } catch (error) {
      console.error(error);
      alert("Hubo un error al crear el formulario.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl p-6 mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Crear Formulario</h1>
      
      <div className="space-y-4">
        <Input
          placeholder="Título del formulario"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
        />

        {questions.map((question, questionIndex) => (
          <div key={questionIndex} className="p-4 border rounded-lg space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Pregunta {questionIndex + 1}</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveQuestion(questionIndex)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <Input
              placeholder="Texto de la pregunta"
              value={question.question_text}
              onChange={(e) => handleQuestionChange(questionIndex, "question_text", e.target.value)}
              disabled={loading}
            />

            <div className="flex space-x-4">
              <Button
                variant={question.type === "multiple_choice" ? "default" : "outline"}
                onClick={() => handleQuestionChange(questionIndex, "type", "multiple_choice")}
              >
                Opción Múltiple
              </Button>
              <Button
                variant={question.type === "open_ended" ? "default" : "outline"}
                onClick={() => handleQuestionChange(questionIndex, "type", "open_ended")}
              >
                Respuesta Abierta
              </Button>
            </div>

            {question.type === "multiple_choice" && (
              <div className="space-y-2">
                {question.options?.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center space-x-2">
                    <Input
                      placeholder={`Opción ${optionIndex + 1}`}
                      value={option}
                      onChange={(e) => handleOptionChange(questionIndex, optionIndex, e.target.value)}
                      disabled={loading}
                    />
                    <input
                      type="radio"
                      name={`correct-${questionIndex}`}
                      checked={question.correct_answer === option}
                      onChange={() => handleQuestionChange(questionIndex, "correct_answer", option)}
                      disabled={loading}
                    />
                  </div>
                ))}
              </div>
            )}

            {question.type === "open_ended" && (
              <Input
                placeholder="Respuesta correcta"
                value={question.correct_answer}
                onChange={(e) => handleQuestionChange(questionIndex, "correct_answer", e.target.value)}
                disabled={loading}
              />
            )}
          </div>
        ))}

        <Button
          variant="outline"
          className="w-full"
          onClick={handleAddQuestion}
          disabled={loading}
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar Pregunta
        </Button>

        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/courses/${courseId}`)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Creando..." : "Crear Formulario"}
          </Button>
        </div>
      </div>
    </div>
  );
} 