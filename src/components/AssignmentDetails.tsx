import { Assignment } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";

interface AssignmentDetailsProps {
  assignment: Assignment | null;
  formatDate: (dateString: string) => string;
}

export function AssignmentDetails({ assignment, formatDate }: AssignmentDetailsProps) {
  if (!assignment) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalles de la tarea</CardTitle>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            <span>Fecha de entrega:</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            <span>{formatDate(assignment.delivery_date)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose max-w-none">
          <pre className="font-sans whitespace-pre-wrap">
            {assignment.description}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}