import { User, Shield, Phone, Calendar, Home, MessageCircle, AlertCircle, Mail, Flag, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/ui/avatar';
import { toast } from 'sonner';

interface LandlordProfileSectionProps {
  onNavigate?: (page: string) => void;
}

export function LandlordProfileSection({ onNavigate }: LandlordProfileSectionProps) {
  const landlord = {
    name: 'Michael Richardson',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    verified: true,
    phone: '+44 7700 900123',
    email: 'michael.richardson@property.co.uk',
    nationality: 'British',
    joinedDate: 'January 2022',
    totalListings: 12,
    reputationScore: 850,
    responseTime: '< 2 hours',
  };

  const handleMessageLandlord = () => {
    if (onNavigate) {
      onNavigate('messages');
    } else {
      toast.success('Opening messages...');
    }
  };

  return (
    <Card className="shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.15)] transition-all duration-300 border-0">
      <CardHeader className="border-b bg-gradient-to-br from-primary/5 to-primary/10">
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Landlord Information
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        {/* Landlord Info Card */}
        <div className="bg-white p-8 rounded-2xl border-2 border-gray-100 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
            {/* Profile Photo */}
            <div className="relative flex-shrink-0">
              <Avatar className="w-28 h-28 border-4 border-white shadow-lg ring-2 ring-primary/20">
                <AvatarImage src={landlord.photo} alt={landlord.name} />
                <AvatarFallback>{landlord.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              {landlord.verified && (
                <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2 border-4 border-white shadow-lg">
                  <Shield className="w-5 h-5 text-white" />
                </div>
              )}
            </div>

            {/* Landlord Details */}
            <div className="flex-1 w-full">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-xl">{landlord.name}</h3>
                {landlord.verified && (
                  <Badge className="bg-green-500 hover:bg-green-600 text-white">
                    <Shield className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Reputation Score</p>
                    <p className="font-semibold text-primary text-lg">{landlord.reputationScore}/1000</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="overflow-hidden flex-1">
                    <p className="text-xs text-gray-600">Email</p>
                    <p className="font-medium text-gray-900 truncate text-sm">{landlord.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Phone</p>
                    <p className="font-medium text-gray-900">{landlord.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Flag className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Nationality</p>
                    <p className="font-medium text-gray-900">{landlord.nationality}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200">
              <div className="font-semibold text-blue-700">98%</div>
              <div className="text-xs text-blue-600 mt-1">Response Rate</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200">
              <div className="font-semibold text-green-700">{landlord.responseTime}</div>
              <div className="text-xs text-green-600 mt-1">Response Time</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200">
              <div className="font-semibold text-purple-700">3 years</div>
              <div className="text-xs text-purple-600 mt-1">Experience</div>
            </div>
          </div>

          {/* Message Button */}
          <Button 
            className="w-full bg-primary hover:bg-primary/90 h-12 shadow-lg hover:shadow-xl transition-all"
            onClick={handleMessageLandlord}
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Message
          </Button>
        </div>

        {/* Safe Arrival Info Box */}
        <div className="p-6 rounded-xl border-2 border-amber-200 bg-amber-50/50">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-700" />
                Safe Arrival Protection
              </h4>
              <p className="text-sm text-amber-900 leading-relaxed mb-3">
                If your property isn't as listed, report it within <span className="font-medium">24 hours of move-in</span>. We'll freeze payment and help resolve it fast. Your safety and satisfaction are our top priorities.
              </p>
              <div className="p-4 rounded-lg bg-white border border-amber-200">
                <p className="text-xs text-amber-900 space-y-1">
                  <span className="block">✓ Full refund if property doesn't match listing</span>
                  <span className="block">✓ 24/7 support team available</span>
                  <span className="block">✓ Alternative accommodation assistance</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-5 rounded-xl border-2 border-border bg-muted/30 hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <h4 className="font-medium">Background Verified</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Identity and property ownership confirmed
            </p>
          </div>

          <div className="p-5 rounded-xl border-2 border-border bg-muted/30 hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <h4 className="font-medium">Quick Responder</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Usually responds within 2 hours
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
