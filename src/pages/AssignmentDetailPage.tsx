import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, Upload, MessageSquare, Paperclip } from 'lucide-react';

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  avatar: string;
}

export function AssignmentDetailPage() {
  const { id } = useParams();
  const [comment, setComment] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Mock data - replace with actual data fetching
  const assignment = {
    id,
    title: 'Ecuaciones Diferenciales',
    class: 'Matemáticas Avanzadas',
    teacher: 'Prof. María González',
    dueDate: '2024-03-25T23:59:59',
    status: 'pending',
    description: `
      Resolver los ejercicios del capítulo 4 sobre ecuaciones diferenciales de primer orden.

      Objetivos:
      - Comprender los conceptos básicos de ecuaciones diferenciales
      - Aplicar métodos de resolución apropiados
      - Interpretar las soluciones en contextos reales

      Instrucciones:
      1. Resolver los ejercicios 4.1 al 4.10
      2. Mostrar todo el procedimiento
      3. Incluir gráficas cuando sea necesario
      4. Entregar en formato PDF
    `,
    points: 100,
  };

  const comments: Comment[] = [
    {
      id: '1',
      author: 'Juan Pérez',
      content: '¿Podemos usar software para las gráficas?',
      timestamp: '2024-03-20T10:30:00',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Juan',
    },
    {
      id: '2',
      author: 'Prof. María González',
      content: 'Sí, pueden usar GeoGebra o cualquier software similar.',
      timestamp: '2024-03-20T11:15:00',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
    },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = () => {
    // Handle assignment submission
    console.log('Submitting assignment:', selectedFile);
  };

  const handleComment = () => {
    if (comment.trim()) {
      // Handle comment submission
      console.log('New comment:', comment);
      setComment('');
    }
  };

  return (
    <div className="flex gap-6">
      {/* Left side - Assignment details and comments */}
      <div className="flex-1 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{assignment.title}</h1>
            <p className="text-gray-600">{assignment.class} • {assignment.teacher}</p>
          </div>
          <Badge variant="secondary" className="text-yellow-800 bg-yellow-100">
            Pendiente
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Detalles de la tarea</CardTitle>
            <CardDescription>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>Fecha de entrega:</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>{formatDate(assignment.dueDate)}</span>
                </div>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <pre className="font-sans whitespace-pre-wrap">{assignment.description}</pre>
            </div>
          </CardContent>
        </Card>

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
                <Button onClick={handleComment}>Comentar</Button>
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
                          {formatDate(comment.timestamp)}
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
      </div>

      {/* Right side - File upload */}
      <div className="w-80">
        <div className="sticky top-6">
          <Card>
            <CardHeader>
              <CardTitle>Tu entrega</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-4">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx"
                  />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Seleccionar archivo
                  </Button>
                  {selectedFile && (
                    <div className="flex items-center p-2 text-sm text-gray-600 rounded bg-gray-50">
                      <Paperclip className="flex-shrink-0 w-4 h-4 mr-1" />
                      <span className="truncate">{selectedFile.name}</span>
                    </div>
                  )}
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  onClick={handleSubmit}
                >
                  Entregar tarea
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}