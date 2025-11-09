import { useState } from 'react';
import { Search, MessageSquare, Eye } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

interface Student {
  id: string;
  name: string;
  photo: string;
  degree: string;
  year: string;
  university: string;
  nationality: string;
  interests: string[];
  about: string;
  housingPreferences: {
    lookingFor: string;
    budget: string;
    moveInDate: string;
  };
  email: string;
}

const MOCK_STUDENTS: Student[] = [
  {
    id: 's1',
    name: 'Sarah Johnson',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
    degree: 'Computer Science',
    year: 'Year 2',
    university: 'University of Manchester',
    nationality: 'United Kingdom',
    interests: ['Coding', 'AI/ML', 'Gaming', 'Coffee', 'Tech Meetups', 'Hiking'],
    about: "Hey! I'm Sarah, a second-year Computer Science student passionate about AI and machine learning. I love coding, attending tech meetups, and exploring new coffee shops. Looking for a friendly place to call home while I focus on my studies.",
    housingPreferences: {
      lookingFor: 'Shared flat near campus',
      budget: '£600–800/month',
      moveInDate: 'September 2025'
    },
    email: 'sarah.j@student.manchester.ac.uk'
  },
  {
    id: 's2',
    name: 'Michael Chen',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    degree: 'Business Administration',
    year: 'Year 1',
    university: 'London Business School',
    nationality: 'Singapore',
    interests: ['Finance', 'Chess', 'Photography', 'Music', 'Traveling'],
    about: "I'm Michael, a first-year Business student from Singapore. I'm passionate about finance and entrepreneurship, and I enjoy playing chess and photography in my free time. Looking for a quiet place to study and network.",
    housingPreferences: {
      lookingFor: 'Studio apartment near university',
      budget: '£700–900/month',
      moveInDate: 'November 2025'
    },
    email: 'michael.chen@lbs.ac.uk'
  },
  {
    id: 's3',
    name: 'Emma Wilson',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80',
    degree: 'Medicine',
    year: 'Year 3',
    university: 'University of Oxford',
    nationality: 'United Kingdom',
    interests: ['Medicine', 'Gardening', 'Running', 'Art', 'Volunteering'],
    about: "Hello! I'm Emma, a third-year Medical student at Oxford. I'm dedicated to my studies but also love staying active through running and volunteering at local clinics. I value a peaceful living environment and enjoy gardening in my spare time.",
    housingPreferences: {
      lookingFor: 'Single room with outdoor space',
      budget: '£650–850/month',
      moveInDate: 'December 2025'
    },
    email: 'emma.wilson@ox.ac.uk'
  },
  {
    id: 's4',
    name: 'David Martinez',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
    degree: 'Engineering',
    year: 'Year 2',
    university: 'Imperial College London',
    nationality: 'Spain',
    interests: ['Robotics', 'Football', 'Cooking', 'Music Production', 'Innovation'],
    about: "¡Hola! I'm David, an Engineering student from Spain studying at Imperial. I'm passionate about robotics and innovation. I love playing football, cooking Spanish cuisine, and producing music in my downtime. Looking for a vibrant student community.",
    housingPreferences: {
      lookingFor: 'Shared house with other students',
      budget: '£550–750/month',
      moveInDate: 'January 2026'
    },
    email: 'david.martinez@imperial.ac.uk'
  },
  {
    id: 's5',
    name: 'Priya Sharma',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
    degree: 'Data Science',
    year: 'Year 1',
    university: 'University of Edinburgh',
    nationality: 'India',
    interests: ['Data Analytics', 'Yoga', 'Reading', 'Cooking', 'Travel'],
    about: "Hi! I'm Priya, a Data Science student from India. I'm fascinated by the power of data and machine learning. In my free time, I practice yoga, read novels, and experiment with cooking recipes from around the world. Seeking a comfortable, study-friendly environment.",
    housingPreferences: {
      lookingFor: 'Private room in shared accommodation',
      budget: '£600–800/month',
      moveInDate: 'October 2025'
    },
    email: 'priya.sharma@ed.ac.uk'
  },
  {
    id: 's6',
    name: 'James Thompson',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80',
    degree: 'Law',
    year: 'Year 3',
    university: 'University of Cambridge',
    nationality: 'United Kingdom',
    interests: ['Debate', 'Politics', 'Reading', 'Rowing', 'History'],
    about: "I'm James, a final-year Law student at Cambridge. I'm deeply interested in constitutional law and political theory. I'm part of the university's rowing team and debate society. Looking for a quiet place conducive to intensive study and preparation for the bar exam.",
    housingPreferences: {
      lookingFor: 'Studio or 1-bed apartment',
      budget: '£750–950/month',
      moveInDate: 'September 2025'
    },
    email: 'james.thompson@cam.ac.uk'
  }
];

interface SearchStudentsPageProps {
  onNavigate: (page: string, studentId?: string) => void;
}

export function SearchStudentsPage({ onNavigate }: SearchStudentsPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [universityFilter, setUniversityFilter] = useState('all');
  const [nationalityFilter, setNationalityFilter] = useState('all');
  const [filteredStudents, setFilteredStudents] = useState<Student[]>(MOCK_STUDENTS);

  // Get unique universities and nationalities for filters
  const universities = ['all', ...Array.from(new Set(MOCK_STUDENTS.map(s => s.university)))];
  const nationalities = ['all', ...Array.from(new Set(MOCK_STUDENTS.map(s => s.nationality)))];

  const applyFilters = () => {
    let filtered = MOCK_STUDENTS;

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.degree.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.interests.some(interest => 
          interest.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // University filter
    if (universityFilter !== 'all') {
      filtered = filtered.filter(student => student.university === universityFilter);
    }

    // Nationality filter
    if (nationalityFilter !== 'all') {
      filtered = filtered.filter(student => student.nationality === nationalityFilter);
    }

    setFilteredStudents(filtered);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setUniversityFilter('all');
    setNationalityFilter('all');
    setFilteredStudents(MOCK_STUDENTS);
  };

  const handleMessageStudent = (studentId: string) => {
    // Navigate to messages page with the student pre-selected
    onNavigate('messages', studentId);
  };

  const handleViewProfile = (studentId: string) => {
    onNavigate('student-profile', studentId);
  };

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
              onClick={applyFilters}
              className="bg-[#8C57FF] hover:bg-[#7C47EF]"
            >
              Apply Filters
            </Button>
            <Button
              onClick={clearFilters}
              variant="outline"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Students Grid */}
      {filteredStudents.length === 0 ? (
        <Card className="p-8 sm:p-12 text-center shadow-lg">
          <p className="text-muted-foreground">No students found matching your criteria</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
          {filteredStudents.map((student) => (
            <Card key={student.id} className="shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-5 sm:p-6 lg:p-7">
                {/* Profile Picture */}
                <div className="flex flex-col items-center mb-3 sm:mb-4">
                  <img
                    src={student.photo}
                    alt={student.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover mb-2 sm:mb-3 border-4 border-[#F4F5FA]"
                  />
                  <h3 className="text-[#4A4A68] text-center mb-1 text-base sm:text-lg">{student.name}</h3>
                  <p className="text-xs sm:text-sm text-[#8C57FF] text-center mb-1 sm:mb-2">
                    {student.degree} • {student.year}
                  </p>
                </div>

                {/* University & Nationality */}
                <div className="space-y-1 sm:space-y-2 mb-3 sm:mb-4 text-center">
                  <p className="text-xs sm:text-sm text-[#4A4A68] leading-snug">{student.university}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{student.nationality}</p>
                </div>

                {/* Interests */}
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

export { MOCK_STUDENTS };
