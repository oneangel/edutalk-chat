import { useState} from "react";
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onCommentSubmit();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
        <MessageSquare className="w-5 h-5 mr-2" />
        Comentarios de la clase {comments.length > 0 && `(${comments.length})`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
            <Textarea
              placeholder="Escribe tu comentario..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              disabled={isSubmitting}
            />
            <Button 
              type="submit" 
              disabled={!comment.trim() || isSubmitting}
            >
              {isSubmitting ? "Publicando..." : "Publicar"}
            </Button>
          </div>
          
          <Separator />
          
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {comments.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                Sé el primero en comentar
              </div>
            ) : comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm">
                      {comment.Author?.name?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium text-sm">
                      {comment.Author?.name || "Usuario desconocido"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.createdAt).toLocaleDateString("es-ES", {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="mt-1 text-gray-800 text-sm">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}