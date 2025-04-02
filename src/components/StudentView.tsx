// src/pages/AssignmentDetailPage/components/StudentView.tsx
import { Assignment, Comment, Submission } from "@/lib/types";
import { AssignmentDetails } from "./AssignmentDetails";
import { CommentsSection } from "./CommentsSection";
import { FileUploadSection } from "./FileUploadSection";
import { Badge } from "@/components/ui/badge";

interface StudentViewProps {
  assignment: Assignment | null;
  submission: Submission | null;
  isLoading: boolean;
  comments: Comment[];
  comment: string;
  selectedFile: File | null;
  uploading: boolean;
  formatDate: (dateString: string) => string;
  setComment: (comment: string) => void;
  setSelectedFile: (file: File | null) => void;
  handleSubmit: () => Promise<void>;
}

export function StudentView({
  assignment,
  submission,
  isLoading,
  comments,
  comment,
  selectedFile,
  uploading,
  formatDate,
  setComment,
  setSelectedFile,
  handleSubmit
}: StudentViewProps) {
  return (
    <>
      <div className="flex-1 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {assignment?.title}
            </h1>
            <p className="text-gray-600">
              {assignment?.courseName} • {assignment?.teacherName}
            </p>
          </div>
          <Badge variant="secondary" className="text-yellow-800 bg-yellow-100">
            {!assignment?.status ? "Pendiente" : "Entregado"}
          </Badge>
        </div>

        <AssignmentDetails assignment={assignment} formatDate={formatDate} />
        <CommentsSection
          comments={comments}
          comment={comment}
          setComment={setComment}
        />
      </div>
      
      <div className="w-80">
        <FileUploadSection
          submission={submission}
          selectedFile={selectedFile}
          uploading={uploading}
          onFileChange={setSelectedFile}
          onSubmit={handleSubmit}
        />
      </div>
    </>
  );
}