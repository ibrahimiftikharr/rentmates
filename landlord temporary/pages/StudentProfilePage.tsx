import { useState, useEffect } from 'react';
import { ChevronLeft, MessageSquare, Mail, MapPin, Calendar, DollarSign, Home, Loader2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { publicStudentService, PublicStudentProfile } from '@/shared/services/publicStudentService';
import { toast } from '@/shared/utils/toast';
import { format } from 'date-fns';

interface StudentProfilePageProps {
  studentId: string;
  onNavigate: (page: string, studentId?: string) => void;
}

export function StudentProfilePage({ studentId, onNavigate }: StudentProfilePageProps) {
  const [student, setStudent] = useState<PublicStudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentProfile();
  }, [studentId]);

  const fetchStudentProfile = async () => {
    try {
      setLoading(true);
      const profile = await publicStudentService.getStudentProfile(studentId);
      setStudent(profile);
    } catch (error: any) {
      console.error('Failed to fetch student profile:', error);
      toast.error(error.message || 'Failed to load student profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <Card className="p-12 text-center shadow-lg">
          <p className="text-muted-foreground">Student not found</p>
          <Button
            onClick={() => onNavigate('search-students')}
            className="mt-4 bg-[#8C57FF] hover:bg-[#7C47EF]"
          >
            Back to Search
          </Button>
        </Card>
      </div>
    );
  }

  const handleSendMessage = () => {
    onNavigate('messages', studentId);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Back Button */}
      <Button
        onClick={() => onNavigate('search-students')}
        variant="ghost"
        className="mb-4 text-[#8C57FF] hover:text-[#7C47EF] hover:bg-[#8C57FF]/5"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Search
      </Button>

      {/* Profile Header Card */}
      <Card className="shadow-lg mb-4 sm:mb-6">
        <CardContent className="p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
            {/* Profile Picture */}
            <img
              src={student.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80'}
              alt={student.name}
              className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full object-cover border-4 border-[#F4F5FA] mx-auto sm:mx-0"
            />

            {/* Basic Info */}
            <div className="flex-1 text-center sm:text-left w-full">
              <h1 className="text-[#4A4A68] mb-2 text-xl sm:text-2xl">{student.name}</h1>
              <p className="text-[#8C57FF] mb-2 text-sm sm:text-base">
                {student.course} • {student.yearOfStudy}
              </p>
              <p className="text-muted-foreground mb-1 text-sm sm:text-base">{student.university}</p>
              <p className="text-sm text-muted-foreground mb-4">{student.nationality}</p>

              {/* Send Message Button */}
              <Button
                onClick={handleSendMessage}
                className="bg-[#8C57FF] hover:bg-[#7C47EF] w-full sm:w-auto"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-5 lg:space-y-6">
          {/* About Me */}
          {student.bio && (
            <Card className="shadow-lg">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-[#4A4A68] text-base sm:text-lg">About Me</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <p className="text-[#4A4A68] leading-relaxed text-sm sm:text-base">{student.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* Interests & Hobbies */}
          {student.interests && student.interests.length > 0 && (
            <Card className="shadow-lg">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-[#4A4A68] text-base sm:text-lg">Interests & Hobbies</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="flex flex-wrap gap-2">
                  {student.interests.map((interest, idx) => (
                    <Badge key={idx} variant="outline" className="bg-white px-2.5 sm:px-3 py-1 text-xs sm:text-sm">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Additional Info */}
        <div className="space-y-4 sm:space-y-5 lg:space-y-6">
          {/* Housing Preferences */}
          <Card className="shadow-lg">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-[#4A4A68] flex items-center gap-2 text-base sm:text-lg">
                <Home className="h-4 w-4 sm:h-5 sm:w-5 text-[#8C57FF]" />
                Housing Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-[#8C57FF] mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">Looking For</p>
                    <p className="text-sm text-[#4A4A68]">
                      {student.housingPreferences.propertyType.join(', ') || 'Not specified'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <DollarSign className="h-4 w-4 text-[#8C57FF] mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">Budget</p>
                    <p className="text-sm text-[#4A4A68]">
                      £{student.housingPreferences.budgetMin} - £{student.housingPreferences.budgetMax}/month
                    </p>
                  </div>
                </div>

                {student.housingPreferences.moveInDate && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-[#8C57FF] mt-1 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">Move-in Date</p>
                      <p className="text-sm text-[#4A4A68]">
                        {format(new Date(student.housingPreferences.moveInDate), 'PPP')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="shadow-lg">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-[#4A4A68] flex items-center gap-2 text-base sm:text-lg">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-[#8C57FF]" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Email</p>
                  <a
                    href={`mailto:${student.email}`}
                    className="text-sm text-[#8C57FF] hover:text-[#7C47EF] break-all"
                  >
                    {student.email}
                  </a>
                </div>

                {student.phone && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Phone</p>
                    <p className="text-sm text-[#4A4A68]">{student.phone}</p>
                  </div>
                )}

                <div className="pt-3 border-t">
                  <Button
                    onClick={handleSendMessage}
                    variant="outline"
                    className="w-full text-[#8C57FF] hover:text-[#7C47EF] hover:border-[#8C57FF]"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Back Button */}
      <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t">
        <Button
          onClick={() => onNavigate('search-students')}
          variant="outline"
          className="w-full sm:w-auto"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Search Students
        </Button>
      </div>
    </div>
  );
}
