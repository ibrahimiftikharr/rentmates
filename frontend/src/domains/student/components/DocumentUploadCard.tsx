import { useState } from 'react';
import { Upload, FileText, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { toast } from 'sonner';

type DocumentStatus = 'uploaded' | 'pending' | 'not-uploaded';

interface Document {
  id: string;
  name: string;
  status: DocumentStatus;
  fileName?: string;
}

export function DocumentUploadCard() {
  const [documents, setDocuments] = useState<Document[]>([
    { id: 'passport', name: 'Passport / National ID', status: 'not-uploaded' },
    { id: 'student-id', name: 'Student ID Card', status: 'uploaded', fileName: 'student_id.pdf' },
    { id: 'visa', name: 'Visa Document', status: 'not-uploaded' },
  ]);

  const handleUpload = (docId: string) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === docId 
        ? { ...doc, status: 'pending' as DocumentStatus, fileName: 'document.pdf' }
        : doc
    ));
    
    toast.success('Uploading document...');
    
    setTimeout(() => {
      setDocuments(prev => prev.map(doc => 
        doc.id === docId 
          ? { ...doc, status: 'uploaded' as DocumentStatus }
          : doc
      ));
      toast.success('Document uploaded successfully!');
    }, 2000);
  };

  const getStatusColor = (status: DocumentStatus) => {
    switch (status) {
      case 'uploaded':
        return 'bg-green-500 text-white';
      case 'pending':
        return 'bg-orange-500 text-white';
      case 'not-uploaded':
        return 'bg-gray-300 text-gray-700';
    }
  };

  const getStatusIcon = (status: DocumentStatus) => {
    switch (status) {
      case 'uploaded':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'not-uploaded':
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: DocumentStatus) => {
    switch (status) {
      case 'uploaded':
        return 'Uploaded';
      case 'pending':
        return 'Processing';
      case 'not-uploaded':
        return 'Not Uploaded';
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Document Upload</CardTitle>
        <CardDescription className="text-sm">
          Upload your identification documents for verification
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {documents.map((doc) => (
            <div 
              key={doc.id} 
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  doc.status === 'uploaded' ? 'bg-green-100' :
                  doc.status === 'pending' ? 'bg-orange-100' :
                  'bg-gray-100'
                }`}>
                  {doc.status === 'uploaded' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : doc.status === 'pending' ? (
                    <Clock className="w-5 h-5 text-orange-600" />
                  ) : (
                    <FileText className="w-5 h-5 text-gray-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm sm:text-base truncate">{doc.name}</p>
                  {doc.fileName && (
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{doc.fileName}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
                <Badge className={`${getStatusColor(doc.status)} text-xs sm:text-sm flex-shrink-0`}>
                  {getStatusIcon(doc.status)}
                  <span className="ml-1">{getStatusText(doc.status)}</span>
                </Badge>
                {doc.status === 'not-uploaded' && (
                  <Button 
                    size="sm"
                    onClick={() => handleUpload(doc.id)}
                    className="text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Upload</span>
                    <span className="sm:hidden">Up</span>
                  </Button>
                )}
                {doc.status === 'uploaded' && (
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpload(doc.id)}
                    className="text-xs sm:text-sm px-2 sm:px-3"
                  >
                    Re-upload
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
