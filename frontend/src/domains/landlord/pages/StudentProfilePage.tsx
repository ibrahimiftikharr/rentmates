import { useState, useEffect } from 'react';
import { ArrowLeft, MessageSquare, Mail, Phone, MapPin, Calendar, DollarSign, Home, CheckCircle, Loader2, Award, FileText, Sparkles } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { publicStudentService, PublicStudentProfile } from '@/shared/services/publicStudentService';
import { toast } from 'sonner';
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
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => onNavigate('search-students')}
          className="flex items-center text-[#8C57FF] hover:text-[#7C47EF] mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">Back to Search</span>
        </button>
        <h1 className="text-2xl font-semibold text-[#4A4A68]">Student Profile</h1>
      </div>

      {/* Profile Card */}
      <Card className="p-6 mb-6 shadow-lg">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Profile Image */}
          <div className="flex-shrink-0">
            <img
              src={student.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80'}
              alt={student.name}
              className="w-32 h-32 rounded-full object-cover border-4 border-gray-100"
            />
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-[#4A4A68] mb-1">{student.name}</h2>
                <p className="text-[#8C57FF] font-medium mb-2">{student.course}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="secondary" className="text-xs">{student.yearOfStudy}</Badge>
                  <Badge variant="secondary" className="text-xs">{student.nationality}</Badge>
                  <Badge className={`text-xs ${
                    student.trustLevel === 'High' ? 'bg-green-500' :
                    student.trustLevel === 'Medium' ? 'bg-blue-500' :
                    student.trustLevel === 'Low' ? 'bg-orange-500' :
                    'bg-red-500'
                  } text-white`}>
                    {student.trustLevel} Trust Level
                  </Badge>
                </div>
              </div>
              <Button
                onClick={handleSendMessage}
                className="bg-[#8C57FF] hover:bg-[#7C47EF] w-full sm:w-auto"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Message Student
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#8C57FF]">{student.reputationScore}</div>
                <div className="text-xs text-gray-600">Reputation Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#8C57FF]">{student.completedTasks || 0}</div>
                <div className="text-xs text-gray-600">Completed Tasks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#8C57FF]">{student.documentsCount || 0}</div>
                <div className="text-xs text-gray-600">Documents</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bio Section */}
        {student.bio && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-sm font-semibold text-[#4A4A68] mb-2">About</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{student.bio}</p>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Information */}
        <Card className="p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-[#4A4A68] mb-4 flex items-center">
            <Mail className="h-5 w-5 mr-2 text-[#8C57FF]" />
            Contact Information
          </h3>
          <div className="space-y-3">
            <div className="flex items-center text-sm">
              <Mail className="h-4 w-4 mr-3 text-gray-400" />
              <span className="text-gray-600">Email:</span>
              <a href={`mailto:${student.email}`} className="ml-2 text-[#8C57FF] hover:underline">
                {student.email}
              </a>
            </div>
            {student.phone && (
              <div className="flex items-center text-sm">
                <Phone className="h-4 w-4 mr-3 text-gray-400" />
                <span className="text-gray-600">Phone:</span>
                <span className="ml-2 text-[#4A4A68]">{student.phone}</span>
              </div>
            )}
            <div className="flex items-center text-sm">
              <MapPin className="h-4 w-4 mr-3 text-gray-400" />
              <span className="text-gray-600">University:</span>
              <span className="ml-2 text-[#4A4A68]">{student.university}</span>
            </div>
          </div>
        </Card>

        {/* Housing Preferences */}
        <Card className="p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-[#4A4A68] mb-4 flex items-center">
            <Home className="h-5 w-5 mr-2 text-[#8C57FF]" />
            Housing Preferences
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Property Type</p>
              <p className="text-sm text-[#4A4A68]">
                {student.housingPreferences.propertyType.join(', ') || 'Any'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Budget Range</p>
              <p className="text-sm text-[#4A4A68] flex items-center">
                <DollarSign className="h-4 w-4 mr-1 text-[#8C57FF]" />
                £{student.housingPreferences.budgetMin} - £{student.housingPreferences.budgetMax}/month
              </p>
            </div>
            {student.housingPreferences.moveInDate && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Move-in Date</p>
                <p className="text-sm text-[#4A4A68] flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-[#8C57FF]" />
                  {format(new Date(student.housingPreferences.moveInDate), 'PPP')}
                </p>
              </div>
            )}
            {student.housingPreferences.preferredAreas.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Preferred Areas</p>
                <p className="text-sm text-[#4A4A68]">
                  {student.housingPreferences.preferredAreas.join(', ')}
                </p>
              </div>
            )}
            {student.housingPreferences.stayDuration && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Stay Duration</p>
                <p className="text-sm text-[#4A4A68]">{student.housingPreferences.stayDuration}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500 mb-2">Additional Preferences</p>
              <div className="flex flex-wrap gap-2">
                {student.housingPreferences.furnished && (
                  <Badge variant="outline" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Furnished
                  </Badge>
                )}
                {student.housingPreferences.billsIncluded && (
                  <Badge variant="outline" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Bills Included
                  </Badge>
                )}
                {student.housingPreferences.petsAllowed && (
                  <Badge variant="outline" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Pets Allowed
                  </Badge>
                )}
                {student.housingPreferences.smokingAllowed && (
                  <Badge variant="outline" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Smoking Allowed
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
