import { useState } from 'react';
import { Globe, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { toast } from 'sonner';

interface Language {
  code: string;
  name: string;
  flag: string;
}

export function LanguageSwitcherCard() {
  const languages: Language[] = [
    { code: 'EN', name: 'English', flag: '🇺🇸' },
    { code: 'ES', name: 'Spanish', flag: '🇪🇸' },
    { code: 'FR', name: 'French', flag: '🇫🇷' },
    { code: 'CN', name: 'Chinese', flag: '🇨🇳' },
  ];

  const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);

  const handleLanguageChange = (language: Language) => {
    setSelectedLanguage(language);
    toast.success(`Language set to ${language.name}`);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          Language Preferences
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Select your preferred language for the application.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Language Display */}
        <div className="bg-primary/10 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{selectedLanguage.flag}</span>
            <div>
              <p className="font-medium">{selectedLanguage.name}</p>
              <p className="text-sm text-muted-foreground">Current language</p>
            </div>
          </div>
          <Badge className="bg-primary text-white">
            <Check className="w-3 h-3 mr-1" />
            Active
          </Badge>
        </div>

        {/* Language Options */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Available Languages</p>
          <div className="grid grid-cols-2 gap-3">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language)}
                className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 sm:gap-3 hover:border-primary/50 ${
                  selectedLanguage.code === language.code
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card'
                }`}
              >
                <span className="text-xl sm:text-2xl flex-shrink-0">{language.flag}</span>
                <div className="text-left flex-1 min-w-0">
                  <p className="font-medium text-sm sm:text-base truncate">{language.name}</p>
                  <p className="text-xs text-muted-foreground">{language.code}</p>
                </div>
                {selectedLanguage.code === language.code && (
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Confirmation Chip */}
        {selectedLanguage && (
          <div className="flex items-center justify-center pt-2">
            <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50">
              ✓ Language set to {selectedLanguage.name}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
