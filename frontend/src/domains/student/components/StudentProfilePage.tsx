import { ArrowLeft, Heart, Mail, Home, Globe, BedDouble, Check } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/ui/avatar';

interface Student {
  id: number;
  name: string;
  photo: string;
  field: string;
  year: string;
  compatibility: number;
  nationality: string;
  university: string;
  bio: string;
  interests: string[];
  email: string;
  phone: string;
  lookingFor?: string;
  budget?: string;
  moveInDate?: string;
}

interface StudentProfilePageProps {
  student: Student;
  onClose: () => void;
  onNavigate?: (page: string) => void;
}

export function StudentProfilePage({ student, onClose, onNavigate }: StudentProfilePageProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={onClose}
          className="gap-2 hover:bg-muted"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Search
        </Button>
      </div>

      {/* Profile Card */}
      <Card className="shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-0">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar */}
            <div className="flex-shrink-0 mx-auto md:mx-0">
              <Avatar className="w-40 h-40 border-4 border-primary/20 shadow-xl">
                <AvatarImage src={student.photo} className="object-cover" />
                <AvatarFallback className="text-2xl">
                  {student.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="mb-3">{student.name}</h1>
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-3 text-gray-600">
                  <BedDouble className="w-5 h-5" />
                  <span>{student.field} • {student.year}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Home className="w-5 h-5" />
                  <span>{student.university}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Globe className="w-5 h-5" />
                  <span>{student.nationality}</span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
                  <Heart className="w-5 h-5 text-primary fill-primary" />
                  <span className="font-semibold text-primary">{student.compatibility}% Match</span>
                </div>
                <Button 
                  className="gap-2"
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate('messages');
                    }
                    onClose();
                  }}
                >
                  <Mail className="w-4 h-4" />
                  Send Message
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bio */}
      <Card className="shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-0">
        <CardContent className="p-6">
          <h2 className="mb-4">About Me</h2>
          <p className="text-gray-600 leading-relaxed">{student.bio}</p>
        </CardContent>
      </Card>

      {/* Interests */}
      <Card className="shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-0">
        <CardContent className="p-6">
          <h2 className="mb-4">Interests & Hobbies</h2>
          <div className="flex flex-wrap gap-3">
            {student.interests.map((interest, index) => (
              <Badge key={index} className="bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2 text-sm border border-primary/20">
                {interest}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Housing Preferences */}
      {(student.lookingFor || student.budget || student.moveInDate) && (
        <Card className="shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-0">
          <CardContent className="p-6">
            <h2 className="mb-4">Housing Preferences</h2>
            <div className="space-y-3">
              {student.lookingFor && (
                <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border border-border/50">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">Looking For</p>
                    <p className="font-medium">{student.lookingFor}</p>
                  </div>
                </div>
              )}
              {student.budget && (
                <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border border-border/50">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">Budget</p>
                    <p className="font-medium">{student.budget}</p>
                  </div>
                </div>
              )}
              {student.moveInDate && (
                <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border border-border/50">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">Move-in Date</p>
                    <p className="font-medium">{student.moveInDate}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact Info */}
      <Card className="shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-0">
        <CardContent className="p-6">
          <h2 className="mb-4">Contact Information</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{student.email}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
