import { useState, useEffect } from 'react';
import { Search, MessageSquare, Eye, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { publicStudentService, PublicStudentProfile } from '@/shared/services/publicStudentService';
import { toast } from 'sonner';

interface SearchStudentsPageProps {
  onNavigate: (page: string, studentId?: string) => void;
}

export function SearchStudentsPage({ onNavigate }: SearchStudentsPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [universityFilter, setUniversityFilter] = useState('all');
  const [nationalityFilter, setNationalityFilter] = useState('all');
  const [students, setStudents] = useState<PublicStudentProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch students on mount and when filters change
  useEffect(() => {
    fetchStudents();
  }, [searchQuery, universityFilter, nationalityFilter]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const results = await publicStudentService.searchStudents({
        search: searchQuery,
        university: universityFilter,
        nationality: nationalityFilter
      });
      setStudents(results);
    } catch (error: any) {
      console.error('Failed to fetch students:', error);
      toast.error(error.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  // Get unique universities and nationalities for filters
  const universities = ['all', ...Array.from(new Set(students.map(s => s.university)))];
  const nationalities = ['all', ...Array.from(new Set(students.map(s => s.nationality)))];
  const clearFilters = () => {
    setSearchQuery('');
    setUniversityFilter('all');
    setNationalityFilter('all');
  };

  const handleMessageStudent = (studentId: string) => {
    onNavigate('messages', studentId);
  };

  const handleViewProfile = (studentId: string) => {
    onNavigate('student-profile', studentId);
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-[#4A4A68] mb-2 text-xl sm:text-2xl">Search Students</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Connect with students looking for accommodation — this boosts your chances of landing a tenant.
        </p>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 sm:p-6 mb-6 shadow-lg">
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or keyword"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* University Filter */}
            <Select value={universityFilter} onValueChange={setUniversityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Universities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Universities</SelectItem>
                {universities.slice(1).map((uni) => (
                  <SelectItem key={uni} value={uni}>{uni}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Nationality Filter */}
            <Select value={nationalityFilter} onValueChange={setNationalityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Nationalities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Nationalities</SelectItem>
                {nationalities.slice(1).map((nat) => (
                  <SelectItem key={nat} value={nat}>{nat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Action Buttons */}
            <Button
              onClick={clearFilters}
              variant="outline"
              className="sm:col-span-2"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Students Grid */}
      {students.length === 0 ? (
        <Card className="p-8 sm:p-12 text-center shadow-lg">
          <p className="text-muted-foreground">No students found matching your criteria</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
          {students.map((student) => (
            <Card key={student.id} className="shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-5 sm:p-6 lg:p-7">
                {/* Profile Picture */}
                <div className="flex flex-col items-center mb-3 sm:mb-4">
                  <img
                    src={student.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80'}
                    alt={student.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover mb-2 sm:mb-3 border-4 border-[#F4F5FA]"
                  />
                  <h3 className="text-[#4A4A68] text-center mb-1 text-base sm:text-lg">{student.name}</h3>
                  <p className="text-xs sm:text-sm text-[#8C57FF] text-center mb-1 sm:mb-2">
                    {student.course} • {student.yearOfStudy}
                  </p>
                </div>

                {/* University & Nationality */}
                <div className="space-y-1 sm:space-y-2 mb-3 sm:mb-4 text-center">
                  <p className="text-xs sm:text-sm text-[#4A4A68] leading-snug">{student.university}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{student.nationality}</p>
                </div>

                {/* Interests */}
                {student.interests && student.interests.length > 0 && (
                  <div className="mb-4 sm:mb-5">
                    <p className="text-xs text-[#8C57FF] mb-2 text-center">Interests</p>
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {student.interests.slice(0, 3).map((interest, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs bg-white px-2 py-0.5">
                          {interest}
                        </Badge>
                      ))}
                      {student.interests.length > 3 && (
                        <Badge variant="outline" className="text-xs bg-[#8C57FF]/10 text-[#8C57FF] px-2 py-0.5">
                          +{student.interests.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5 lg:gap-3">
                  <Button
                    onClick={() => handleViewProfile(student.id)}
                    variant="outline"
                    className="flex-1 text-[#8C57FF] hover:text-[#7C47EF] hover:border-[#8C57FF] text-xs sm:text-sm"
                  >
                    <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                    View Profile
                  </Button>
                  <Button
                    onClick={() => handleMessageStudent(student.id)}
                    className="flex-1 bg-[#8C57FF] hover:bg-[#7C47EF] text-xs sm:text-sm"
                  >
                    <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                    Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
