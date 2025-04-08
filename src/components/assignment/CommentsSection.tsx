// src/pages/AssignmentDetailPage/components/CommentsSection.tsx
import { Comment } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CommentsSectionProps {
  comments: Comment[];
  comment: string;
  setComment: (comment: string) => void;
  onCommentSubmit: () => void;
}

export function CommentsSection({ 
  comments, 
  comment, 
  setComment,
  onCommentSubmit 
}: CommentsSectionProps) {
  const handleCommentSubmit = () => {
    if (comment.trim()) {
      onCommentSubmit();
      setComment("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MessageSquare className="w-5 h-5 mr-2" />
          Comentarios de la clase
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Textarea
              placeholder="Añadir un comentario..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <Button onClick={handleCommentSubmit}>Comentar</Button>
          </div>
          <Separator />
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3">
                <img
                  src={comment.avatar}
                  alt={comment.author}
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{comment.author}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(comment.timestamp).toLocaleDateString("es-ES", {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="mt-1 text-gray-600">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}