import { Assignment, Submission } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmissionItem } from "../components/assignment/SubmissionItem";
import { Clock } from "lucide-react";

interface TeacherViewProps {
  assignment: Assignment | null;
  submissions: Submission[];
  handleGradeUpdate: (submissionId: string, newGrade: number | null) => void;
  formatDate: (dateString: string) => string;
}

export function SubmissionsPage ({
  assignment,
  submissions,
  handleGradeUpdate,
  formatDate
}: TeacherViewProps) {
  const countByStatus = (status: string) => 
    submissions.filter(s => s.status === status).length;

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {assignment?.title} - Entregas
          </h1>
          <p className="text-gray-600">
            {assignment?.courseName} • {assignment?.teacherName}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            {countByStatus('submitted')} En tiempo
          </Badge>
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            {countByStatus('late')} Tarde
          </Badge>
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            {countByStatus('graded')} Calificadas
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Listado de entregas</span>
            {assignment?.delivery_date && (
              <div className="flex items-center text-sm">
                <Clock className="w-4 h-4 mr-1" />
                <span>Fecha límite: {formatDate(assignment.delivery_date)}</span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {submissions.map((submission) => (
            <SubmissionItem
              key={submission.id}
              submission={submission}
              onGradeUpdate={handleGradeUpdate}
              formatDate={formatDate}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}