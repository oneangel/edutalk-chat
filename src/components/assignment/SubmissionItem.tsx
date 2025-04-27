import { useState } from "react";
import { Submission } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Paperclip } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SubmissionItemProps {
  submission: Submission;
  onGradeUpdate: (submissionId: string, newGrade: number | null) => void;
  formatDate: (dateString: string) => string;
}

export function SubmissionItem({
  submission,
  onGradeUpdate,
  formatDate,
}: SubmissionItemProps) {
  const [gradeInput, setGradeInput] = useState<number | null>(submission.grade);

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg gap-4">
      <div className="flex items-center gap-3 flex-1">
        <div className="min-w-0">
        <p className="font-medium truncate">
          {submission.student 
            ? `${submission.student.name} ${submission.student.lastname}`
            : `Estudiante ${submission.student_id.slice(-4)}`}
        </p>
          <div className="flex items-center gap-2 mt-1">
          <Badge
            variant={
              submission.status === "graded"
                ? "default"
                : submission.onTime
                ? "secondary"
                : "destructive"
            }
          >
            {submission.status === "graded"
              ? "Calificado"
              : submission.onTime
              ? "En tiempo"
              : "Tarde"}
          </Badge>
            <span className="text-sm text-gray-500">
              {formatDate(submission.createdAt)}
            </span>
          </div>
        </div>

        <a
          href={submission.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline flex items-center"
        >
          <Paperclip className="mr-1 w-4 h-4" />
          Ver entrega
        </a>
      </div>

      <div className="flex items-center gap-2">
        {submission.grade !== null && (
          <span className="text-sm font-medium">{submission.grade}/100</span>
        )}
        <Input
          type="number"
          value={gradeInput ?? ""}
          onChange={(e) =>
            setGradeInput(
              e.target.value === "" ? null : Number(e.target.value)
            )
          }
          min="0"
          max="100"
          className="w-20"
        />
        <Button
          onClick={() => onGradeUpdate(submission.id, gradeInput)}
          disabled={gradeInput === submission.grade}
          size="sm"
        >
          {gradeInput === submission.grade ? "✓" : "Actualizar"}
        </Button>
      </div>
    </div>
  );
}
