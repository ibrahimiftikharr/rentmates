import { useRef } from 'react';
import { Upload, FileText, CheckCircle, Loader2, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { StudentProfile } from '../services/studentService';

interface DocumentUploadCardProps {
  profile: StudentProfile;
  onUpload: (file: File, documentType: string) => Promise<any>;
  onDelete: (documentType: string) => Promise<void>;
}

interface DocumentType {
  id: keyof StudentProfile['documents'];
  name: string;
  required: boolean;
}

export function DocumentUploadCard({ profile, onUpload, onDelete }: DocumentUploadCardProps) {
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const documentTypes: DocumentType[] = [
    { id: 'profileImage', name: 'Profile Image', required: false },
    { id: 'passport', name: 'Passport/National ID', required: true },
    { id: 'proofOfEnrollment', name: 'Proof of Enrollment', required: false },
  ];

  const handleFileSelect = async (documentType: keyof StudentProfile['documents'], event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only JPG, PNG, and PDF files are allowed');
      return;
    }

    await onUpload(file, documentType);
    
    // Reset file input
    if (fileInputRefs.current[documentType]) {
      fileInputRefs.current[documentType]!.value = '';
    }
  };

  const handleDelete = async (documentType: keyof StudentProfile['documents']) => {
    if (confirm('Are you sure you want to delete this document?')) {
      await onDelete(documentType);
    }
  };

  const getDocumentStatus = (documentType: keyof StudentProfile['documents']) => {
    return profile.documents?.[documentType] ? 'uploaded' : 'not-uploaded';
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Document Upload</CardTitle>
        <CardDescription className="text-sm">
          Upload your identification documents for verification. National ID or Passport required for reputation boost (+25 points).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {documentTypes.map((docType) => {
            const status = getDocumentStatus(docType.id);
            const documentUrl = profile.documents?.[docType.id];
            
            return (
              <div 
                key={docType.id} 
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    status === 'uploaded' ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {status === 'uploaded' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <FileText className="w-5 h-5 text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm sm:text-base truncate">{docType.name}</p>
                      {docType.required && (
                        <Badge variant="outline" className="text-xs">Required</Badge>
                      )}
                    </div>
                    {documentUrl && (
                      <a 
                        href={documentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs sm:text-sm text-primary hover:underline truncate block"
                      >
                        View document
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
                  <Badge className={`${
                    status === 'uploaded' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-300 text-gray-700'
                  } text-xs sm:text-sm flex-shrink-0`}>
                    {status === 'uploaded' ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Uploaded
                      </>
                    ) : (
                      <>
                        <FileText className="w-3 h-3 mr-1" />
                        Not Uploaded
                      </>
                    )}
                  </Badge>
                  
                  <input
                    ref={(el) => (fileInputRefs.current[docType.id] = el)}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                    onChange={(e) => handleFileSelect(docType.id, e)}
                    className="hidden"
                    id={`file-${docType.id}`}
                  />
                  
                  {status === 'not-uploaded' ? (
                    <Button 
                      size="sm"
                      onClick={() => fileInputRefs.current[docType.id]?.click()}
                      className="text-xs sm:text-sm px-2 sm:px-3"
                    >
                      <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Upload</span>
                      <span className="sm:hidden">Up</span>
                    </Button>
                  ) : (
                    <>
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => fileInputRefs.current[docType.id]?.click()}
                        className="text-xs sm:text-sm px-2 sm:px-3"
                      >
                        <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                      <Button 
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(docType.id)}
                        className="text-xs sm:text-sm px-2 sm:px-3"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Documents Count Summary */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{profile.documentsCount || 0}</span> documents uploaded
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
