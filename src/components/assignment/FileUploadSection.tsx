import { useState, useRef } from 'react';
import { Submission } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Paperclip, XCircle, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface FileUploadSectionProps {
  submission: Submission | null;
  selectedFile: File | null;
  uploading: boolean;
  onFileChange: (file: File | null) => void;
  onSubmit: () => Promise<void>;
}

export function FileUploadSection({
  submission,
  selectedFile,
  uploading,
  onFileChange,
  onSubmit
}: FileUploadSectionProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo (PDF, Word)
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Archivo no válido",
          description: "Por favor, sube un archivo PDF o Word (.doc, .docx)",
          variant: "destructive"
        });
        return;
      }
      
      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Archivo demasiado grande",
          description: "El tamaño máximo permitido es 5MB",
          variant: "destructive"
        });
        return;
      }
      
      onFileChange(file);
    }
  };

  const handleRemoveFile = () => {
    onFileChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = () => {
    if (!submission?.file_url) return;
    
    const link = document.createElement('a');
    link.href = submission.file_url;
    link.download = `entrega-${submission.id}.${submission.file_url.split('.').pop()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Tu entrega</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {submission?.file_url ? (
            <div className="flex flex-col gap-3">
              <div 
                className="flex items-center p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={handleDownload}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
              >
                <Paperclip className="flex-shrink-0 w-5 h-5 mr-3 text-gray-600" />
                <span className="truncate flex-1">
                  {submission.file_url.split('/').pop()}
                </span>
                <Download className={`w-5 h-5 text-blue-600 transition-opacity ${isHovering ? 'opacity-100' : 'opacity-0'}`} />
              </div>
              <Badge variant="outline" className="self-start bg-green-100 text-green-800">
                Entregado
              </Badge>
            </div>
          ) : (
            <>
              <input
                type="file"
                id="file-upload"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              />
              <Button
                variant="outline"
                className="w-full h-24 border-2 border-dashed flex flex-col gap-2 hover:bg-gray-50"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-6 h-6 text-gray-500" />
                <span className="text-gray-700">Seleccionar archivo</span>
                <span className="text-xs text-gray-500">PDF o Word (max. 5MB)</span>
              </Button>

              {selectedFile && (
                <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Paperclip className="flex-shrink-0 w-5 h-5 text-gray-600" />
                    <span className="truncate max-w-xs">{selectedFile.name}</span>
                    <span className="text-xs text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)}MB
                    </span>
                  </div>
                  <button
                    onClick={handleRemoveFile}
                    className="text-red-500 hover:text-red-700"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}

          {!submission?.file_url && (
            <Button
              className="w-full bg-gradient-to-r from-emerald-700 to-emerald-500 hover:from-emerald-800 hover:to-emerald-700 text-white"
              onClick={onSubmit}
              disabled={uploading || !selectedFile}
            >
              {uploading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Subiendo...
                </span>
              ) : (
                "Entregar tarea"
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}