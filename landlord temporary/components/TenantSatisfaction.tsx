import { Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

const tenants = [
  {
    name: 'Sarah Johnson',
    property: 'Downtown Loft A',
    rating: 5,
    comment: 'Excellent property management and quick response times!',
  },
  {
    name: 'Michael Chen',
    property: 'Riverside Apartment 3B',
    rating: 4,
    comment: 'Great communication, minor maintenance delays.',
  },
  {
    name: 'Emma Williams',
    property: 'City Center Studio',
    rating: 5,
    comment: 'Very professional and accommodating landlord.',
  },
];

export function TenantSatisfaction() {
  const averageRating = (
    tenants.reduce((acc, t) => acc + t.rating, 0) / tenants.length
  ).toFixed(1);

  return (
    <Card className="border-0 shadow-lg rounded-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-[#4A4A68]">Tenant Satisfaction</CardTitle>
          <div className="flex items-center gap-2 bg-[#28C76F]/10 px-4 py-2 rounded-xl">
            <Star className="h-5 w-5 text-[#28C76F] fill-[#28C76F]" />
            <span className="text-[#28C76F]">{averageRating}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {tenants.map((tenant, index) => (
          <div
            key={index}
            className="p-4 bg-[#F4F5FA] rounded-xl space-y-2"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">{tenant.name}</p>
                <p className="text-xs text-muted-foreground">{tenant.property}</p>
              </div>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < tenant.rating
                        ? 'text-[#FF9F43] fill-[#FF9F43]'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground italic">"{tenant.comment}"</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
