import { useState } from 'react';
import { Search, SlidersHorizontal, GraduationCap, Globe, Heart, X, Users, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { StudentProfilePage } from '../components/StudentProfilePage';

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

interface SearchStudentsPageProps {
  onNavigate?: (page: string) => void;
}

export function SearchStudentsPage({ onNavigate }: SearchStudentsPageProps = {}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('all');
  const [selectedNationality, setSelectedNationality] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Mock students data
  const students: Student[] = [
    {
      id: 1,
      name: 'Sarah Johnson',
      photo: 'https://images.unsplash.com/photo-1655249481446-25d575f1c054?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHdvbWFufGVufDF8fHx8MTc2MjU3MDkyOXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      field: 'Computer Science',
      year: 'Year 2',
      compatibility: 92,
      nationality: 'United Kingdom',
      university: 'University of Manchester',
      bio: 'Hey! I\'m Sarah, a second-year Computer Science student passionate about AI and machine learning. I love coding late at night and enjoy collaborative study sessions. Looking for like-minded flatmates who appreciate a clean, organized living space.',
      interests: ['Coding', 'AI/ML', 'Gaming', 'Coffee', 'Tech Meetups', 'Hiking'],
      email: 'sarah.j@student.manchester.ac.uk',
      phone: '+44 7700 900123',
      lookingFor: 'Shared flat near campus',
      budget: '£600-800/month',
      moveInDate: 'September 2025'
    },
    {
      id: 2,
      name: 'Emma Wilson',
      photo: 'https://images.unsplash.com/photo-1580643735948-c52d25d9c07d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHBvcnRyYWl0JTIwd29tYW58ZW58MXx8fHwxNzYyNTM2MTMzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      field: 'Business Management',
      year: 'Year 3',
      compatibility: 87,
      nationality: 'United States',
      university: 'Imperial College London',
      bio: 'Business student with a passion for entrepreneurship and innovation. I\'m organized, friendly, and love hosting small gatherings. Looking for a social yet respectful living environment.',
      interests: ['Business', 'Networking', 'Yoga', 'Cooking', 'Travel', 'Photography'],
      email: 'emma.w@imperial.ac.uk',
      phone: '+44 7700 900456',
      lookingFor: 'Private room in shared house',
      budget: '£700-900/month',
      moveInDate: 'January 2026'
    },
    {
      id: 3,
      name: 'Alex Chen',
      photo: 'https://images.unsplash.com/photo-1678542230173-8e2c3eb87c85?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBwb3J0cmFpdCUyMGFzaWFufGVufDF8fHx8MTc2MjYwMDg1NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      field: 'Engineering',
      year: 'Year 1',
      compatibility: 85,
      nationality: 'China',
      university: 'University of Cambridge',
      bio: 'First-year Engineering student from China. I\'m quiet, respectful, and enjoy cooking Asian cuisine. I love studying in a peaceful environment and occasionally watching movies.',
      interests: ['Engineering', 'Robotics', 'Cooking', 'Movies', 'Basketball', 'Music'],
      email: 'alex.chen@cam.ac.uk',
      phone: '+44 7700 900789',
      lookingFor: 'Studio or shared flat',
      budget: '£500-700/month',
      moveInDate: 'October 2025'
    },
    {
      id: 4,
      name: 'Priya Sharma',
      photo: 'https://images.unsplash.com/photo-1651684215020-f7a5b6610f23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHNtaWxlfGVufDF8fHx8MTc2MjYxMDAxNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      field: 'Medicine',
      year: 'Year 4',
      compatibility: 90,
      nationality: 'India',
      university: 'University of Oxford',
      bio: 'Medical student in my fourth year. I maintain a disciplined schedule but love socializing on weekends. Looking for mature flatmates who understand the demands of medical school.',
      interests: ['Medicine', 'Research', 'Dance', 'Volunteering', 'Reading', 'Meditation'],
      email: 'priya.s@ox.ac.uk',
      phone: '+44 7700 900321',
      lookingFor: 'Quiet shared accommodation',
      budget: '£650-850/month',
      moveInDate: 'August 2025'
    },
    {
      id: 5,
      name: 'Lucas Müller',
      photo: 'https://images.unsplash.com/photo-1624835567150-0c530a20d8cc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHBvcnRyYWl0JTIwbWFufGVufDF8fHx8MTc2MjU1NTcwNHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      field: 'Architecture',
      year: 'Year 2',
      compatibility: 78,
      nationality: 'Germany',
      university: 'University College London',
      bio: 'Architecture student with a love for design and creativity. I enjoy late-night design sessions and appreciate living with creative individuals. Clean and organized.',
      interests: ['Architecture', 'Design', 'Photography', 'Art', 'Cycling', 'Museums'],
      email: 'lucas.m@ucl.ac.uk',
      phone: '+44 7700 900654',
      lookingFor: 'Creative flatshare',
      budget: '£700-950/month',
      moveInDate: 'September 2025'
    },
    {
      id: 6,
      name: 'Olivia Brown',
      photo: 'https://images.unsplash.com/photo-1672685667592-0392f458f46f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMG1hbnxlbnwxfHx8fDE3NjI2MDY4MDF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      field: 'Psychology',
      year: 'Year 3',
      compatibility: 93,
      nationality: 'Canada',
      university: 'University of Manchester',
      bio: 'Psychology major passionate about mental health and well-being. I\'m empathetic, friendly, and value open communication. Looking for supportive and understanding flatmates.',
      interests: ['Psychology', 'Mental Health', 'Podcasts', 'Running', 'Book Clubs', 'Nature'],
      email: 'olivia.b@manchester.ac.uk',
      phone: '+44 7700 900987',
      lookingFor: 'Female-only flatshare',
      budget: '£600-800/month',
      moveInDate: 'September 2025'
    }
  ];

  // Get unique universities and nationalities for filters
  const universities = ['all', ...Array.from(new Set(students.map(s => s.university)))];
  const nationalities = ['all', ...Array.from(new Set(students.map(s => s.nationality)))];

  const getCompatibilityColor = (score: number) => {
    if (score >= 85) return 'bg-green-500';
    if (score >= 70) return 'bg-blue-500';
    return 'bg-orange-500';
  };

  // Filter students
  const filteredStudents = students.filter(student => {
    const matchesSearch = searchQuery === '' ||
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.field.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.university.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.nationality.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesUniversity = selectedUniversity === 'all' || student.university === selectedUniversity;
    const matchesNationality = selectedNationality === 'all' || student.nationality === selectedNationality;

    return matchesSearch && matchesUniversity && matchesNationality;
  });

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedUniversity('all');
    setSelectedNationality('all');
  };

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
                          <div className={`absolute -bottom-1 -right-1 ${getCompatibilityColor(student.compatibility)} text-white px-2.5 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1`}>
                            <Heart className="w-3.5 h-3.5 fill-white" />
                            {student.compatibility}%
                          </div>
                        </div>

                        <h3 className="text-center mb-0.5">{student.name}</h3>
                        <p className="text-sm text-muted-foreground text-center">
                          {student.field} • {student.year}
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
                          <span className="font-semibold text-primary">{student.compatibility}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getCompatibilityColor(student.compatibility)} transition-all duration-500`}
                            style={{ width: `${student.compatibility}%` }}
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
