import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, GraduationCap, Globe, Heart, X, Users, Mail, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { StudentProfilePage } from '../components/StudentProfilePage';
import { studentSearchService, type CompatibleStudent } from '../services/studentSearchService';
import { toast } from '@/shared/utils/toast';

interface SearchStudentsPageProps {
  onNavigate?: (page: string) => void;
}

export function SearchStudentsPage({ onNavigate }: SearchStudentsPageProps = {}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('all');
  const [selectedNationality, setSelectedNationality] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [students, setStudents] = useState<CompatibleStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredStudents, setFilteredStudents] = useState<CompatibleStudent[]>([]);

  // Fetch students on mount
  useEffect(() => {
    fetchStudents();
  }, []);

  // Filter students when search or filters change
  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedUniversity, selectedNationality, students]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await studentSearchService.getStudentsWithCompatibility();
      setStudents(data);
    } catch (error: any) {
      console.error('Failed to fetch students:', error);
      toast.error(error.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let results = [...students];

    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      results = results.filter(student => 
        student.name.toLowerCase().includes(searchLower) ||
        student.course.toLowerCase().includes(searchLower) ||
        student.university.toLowerCase().includes(searchLower) ||
        student.nationality.toLowerCase().includes(searchLower) ||
        student.bio?.toLowerCase().includes(searchLower)
      );
    }

    // Apply university filter
    if (selectedUniversity !== 'all') {
      results = results.filter(student => student.university === selectedUniversity);
    }

    // Apply nationality filter
    if (selectedNationality !== 'all') {
      results = results.filter(student => student.nationality === selectedNationality);
    }

    setFilteredStudents(results);
  };

  // Get unique universities and nationalities for filters
  const universities = ['all', ...Array.from(new Set(students.map(s => s.university)))];
  const nationalities = ['all', ...Array.from(new Set(students.map(s => s.nationality)))];

  const getCompatibilityColor = (score: number) => {
    if (score >= 85) return 'bg-green-500';
    if (score >= 70) return 'bg-blue-500';
    return 'bg-orange-500';
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedUniversity('all');
    setSelectedNationality('all');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {selectedStudent ? (
        <StudentProfilePage
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onNavigate={onNavigate}
        />
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="mb-2">Find Your Perfect Flatmate</h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Connect with students looking for accommodation
            </p>
          </div>

          {/* Search Bar */}
         <Card className="shadow-sm border-2">
  <CardContent className="p-4 md:p-6">
    <div className="flex flex-col sm:flex-row gap-3">

      {/* Search Field */}
      <div className="relative flex-1">
        <div className="flex items-center bg-gray-50 border-2 rounded-md h-12 md:h-14 px-4 focus-within:border-primary">
          <Search className="w-5 h-5 text-muted-foreground mr-6 flex-shrink-0" /> {/* was mr-3 */}
          <input
            type="text"
            placeholder="Search by name, field, university, or nationality..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-transparent outline-none text-sm md:text-base placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Filters Button */}
      <Button
        variant="outline"
        size="lg"
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 px-6 border-2 h-12 md:h-14"
      >
        <SlidersHorizontal className="w-5 h-5" />
        Filters
        {(selectedUniversity !== 'all' || selectedNationality !== 'all') && (
          <Badge className="ml-2 bg-primary text-white">
            {(selectedUniversity !== 'all' ? 1 : 0) + (selectedNationality !== 'all' ? 1 : 0)}
          </Badge>
        )}
      </Button>
    </div>
  </CardContent>
</Card>


          {/* Filters */}
          {showFilters && (
            <Card className="shadow-md border-2">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-primary" />
                    Filter Students
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* University Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-primary" />
                      University
                    </label>
                    <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
                      <SelectTrigger className="border-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Universities</SelectItem>
                        {universities.slice(1).map(uni => (
                          <SelectItem key={uni} value={uni}>{uni}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Nationality Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Globe className="w-4 h-4 text-primary" />
                      Nationality
                    </label>
                    <Select value={selectedNationality} onValueChange={setSelectedNationality}>
                      <SelectTrigger className="border-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Nationalities</SelectItem>
                        {nationalities.slice(1).map(nat => (
                          <SelectItem key={nat} value={nat}>{nat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Clear Filters */}
                {(selectedUniversity !== 'all' || selectedNationality !== 'all') && (
                  <div className="mt-6 flex justify-end">
                    <Button variant="outline" onClick={handleClearFilters} className="border-2">
                      Clear All Filters
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Results Count */}
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filteredStudents.length}</span> students
            </p>
          </div>

          {/* Student Cards */}
          {filteredStudents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStudents.map(student => (
                <Card
                  key={student.id}
                  className="shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_20px_60px_rgb(0,0,0,0.2)] transition-all duration-300 border-0 overflow-hidden bg-white"
                >
                  <CardContent className="p-0">
                    {/* Profile Photo Section with Background */}
                    <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 pb-3">
                      <div className="flex flex-col items-center">
                        <div className="relative mb-3">
                          <Avatar className="w-28 h-28 border-4 border-white shadow-[0_4px_14px_rgb(0,0,0,0.15)]">
                            <AvatarImage src={student.photo} alt={student.name} className="object-cover" />
                            <AvatarFallback className="text-xl bg-primary/20">
                              {student.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          {/* Compatibility Badge */}
                          <div className={`absolute -bottom-1 -right-1 ${getCompatibilityColor(student.compatibilityScore)} text-white px-2.5 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1`}>
                            <Heart className="w-3.5 h-3.5 fill-white" />
                            {student.compatibilityScore}%
                          </div>
                        </div>

                        <h3 className="text-center mb-0.5">{student.name}</h3>
                        <p className="text-sm text-muted-foreground text-center">
                          {student.course} • {student.yearOfStudy}
                        </p>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="px-6 py-4 space-y-4">
                      {/* University & Nationality */}
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2.5 text-sm">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <GraduationCap className="w-4 h-4 text-primary" />
                          </div>
                          <span className="line-clamp-1 text-gray-700">{student.university}</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-sm">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Globe className="w-4 h-4 text-primary" />
                          </div>
                          <span className="line-clamp-1 text-gray-700">{student.nationality}</span>
                        </div>
                      </div>

                      {/* Compatibility Score */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-muted-foreground font-medium">Compatibility Match</span>
                          <span className="font-semibold text-primary">{student.compatibilityScore}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getCompatibilityColor(student.compatibilityScore)} transition-all duration-500`}
                            style={{ width: `${student.compatibilityScore}%` }}
                          />
                        </div>
                      </div>

                      {/* Interests Preview */}
                      <div className="flex flex-wrap gap-2">
                        {student.interests.slice(0, 3).map((interest, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="bg-primary/5 text-primary border-primary/20 text-xs px-2.5 py-0.5"
                          >
                            {interest}
                          </Badge>
                        ))}
                        {student.interests.length > 3 && (
                          <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-muted text-xs px-2.5 py-0.5">
                            +{student.interests.length - 3}
                          </Badge>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <Button
                          variant="outline"
                          className="border-2 hover:border-primary hover:bg-primary/5 transition-all"
                          onClick={() => setSelectedStudent(student)}
                        >
                          <Users className="w-4 h-4 mr-1.5" />
                          Profile
                        </Button>
                        <Button
                          className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onNavigate) {
                              onNavigate('messages');
                            }
                          }}
                        >
                          <Mail className="w-4 h-4 mr-1.5" />
                          Message
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="shadow-md border-2">
              <CardContent className="py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10 text-primary" />
                </div>
                <h3 className="mb-3">No students found</h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your filters or search criteria to find the perfect flatmate
                </p>
                <Button onClick={handleClearFilters} variant="outline" size="lg" className="border-2">
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
