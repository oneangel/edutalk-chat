import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { jwtDecode } from "jwt-decode";

interface Question {
  question_text: string;
  type: "multiple_choice" | "open_ended";
  options?: string[];
  correct_answer: string;
}

interface Quiz {
  id: string;
  title: string;
  questions: Question[];
  start_date: string;
  end_date: string;
  time_limit_minutes: number;
}

interface QuizResponse {
  question_text: string;
  student_answer: string;
}

export function TakeQuizPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [responses, setResponses] = useState<QuizResponse[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [studentId, setStudentId] = useState<string>("");

  useEffect(() => {
    const fetchQuiz = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        return;
      }

      try {
        // Get student ID from token
        const decodedToken = jwtDecode(token) as { [key: string]: any };
        setStudentId(decodedToken.id);

        // Fetch quiz data
        const response = await fetch(`https://edutalk-by8w.onrender.com/api/quizzes/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Error al obtener el quiz");
        }

        const quizData = await response.json();
        setQuiz(quizData);

        // Initialize responses array
        const initialResponses = quizData.questions.map((question: Question) => ({
          question_text: question.question_text,
          student_answer: "",
        }));
        setResponses(initialResponses);

        // Set time limit if exists
        if (quizData.time_limit_minutes) {
          setTimeLeft(quizData.time_limit_minutes * 60);
        }
      } catch (error) {
        console.error(error);
        alert("Hubo un error al cargar el quiz.");
      }
    };

    fetchQuiz();
  }, [id]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  const handleResponseChange = (questionIndex: number, answer: string) => {
    const newResponses = [...responses];
    newResponses[questionIndex].student_answer = answer;
    setResponses(newResponses);
  };

  const handleSubmit = async () => {
    if (responses.some(response => !response.student_answer)) {
      if (!confirm("Hay preguntas sin responder. ¿Deseas enviar el quiz de todas formas?")) {
        return;
      }
    }

    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found");
      return;
    }

    setLoading(true);

    try {
      // Calculate time taken in minutes
      const timeTaken = quiz?.time_limit_minutes 
        ? quiz.time_limit_minutes - Math.ceil(timeLeft / 60)
        : null;

      const response = await fetch("https://edutalk-by8w.onrender.com/api/quiz-attempts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quiz_id: id,
          student_id: studentId,
          responses,
          time_taken_minutes: timeTaken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Quiz submission error:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(`Error al enviar el quiz: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      alert(`Quiz enviado correctamente. Tu calificación: ${result.score}%`);
      navigate(`/tareas/${id}`);
    } catch (error) {
      console.error('Full error details:', error);
      alert(error instanceof Error ? error.message : "Hubo un error al enviar el quiz.");
    } finally {
      setLoading(false);
    }
  };

  if (!quiz) {
    return <div className="p-4 text-center">Cargando quiz...</div>;
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl p-6 mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{quiz.title}</h1>
        {quiz.time_limit_minutes > 0 && (
          <div className="text-lg font-semibold">
            Tiempo restante: {formatTime(timeLeft)}
          </div>
        )}
      </div>

      <div className="space-y-6">
        {quiz.questions.map((question, questionIndex) => (
          <div key={questionIndex} className="p-4 border rounded-lg space-y-4">
            <h3 className="font-semibold">
              Pregunta {questionIndex + 1}: {question.question_text}
            </h3>

            {question.type === "multiple_choice" ? (
              <div className="space-y-2">
                {question.options?.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name={`question-${questionIndex}`}
                      id={`option-${questionIndex}-${optionIndex}`}
                      checked={responses[questionIndex].student_answer === option}
                      onChange={() => handleResponseChange(questionIndex, option)}
                      disabled={loading}
                    />
                    <label htmlFor={`option-${questionIndex}-${optionIndex}`}>
                      {option}
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <Input
                placeholder="Escribe tu respuesta"
                value={responses[questionIndex].student_answer}
                onChange={(e) => handleResponseChange(questionIndex, e.target.value)}
                disabled={loading}
              />
            )}
          </div>
        ))}

        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/tareas/${id}`)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Enviando..." : "Enviar Quiz"}
          </Button>
        </div>
      </div>
    </div>
  );
} 