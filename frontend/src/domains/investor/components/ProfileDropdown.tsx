import { useEffect, useState } from "react";
import { User, LogOut, UserCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup } from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { investorService, InvestorProfile } from "../services/investorService";
import { authService } from "@/domains/auth/services/authService";

interface ProfileDropdownProps {
  onNavigate?: (page: string) => void;
}

export function ProfileDropdown({ onNavigate }: ProfileDropdownProps) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<InvestorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProfile();

    // Listen for profile updates
    const handleProfileUpdate = () => {
      fetchProfile();
    };

    window.addEventListener('investorProfileUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('investorProfileUpdated', handleProfileUpdate);
    };
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await investorService.getProfile();
      setProfile(data);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileClick = () => {
    if (onNavigate) {
      onNavigate("profile");
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      toast.success("Logged out successfully", {
        description: "See you next time!"
      });
      // Use window.location for a full page reload to ensure clean state
      window.location.href = "/auth";
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  // Get initials for fallback avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all">
          <Avatar className="h-9 w-9 border-2 border-primary/20 cursor-pointer hover:border-primary/40 transition-colors">
            {profile?.profileImage ? (
              <AvatarImage src={profile.profileImage} alt={profile.name} className="object-cover" />
            ) : null}
            <AvatarFallback className="bg-gradient-to-br from-primary to-[#7367F0] text-white">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : profile ? (
                getInitials(profile.name)
              ) : (
                <User className="h-4 w-4" />
              )}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72" align="end">
        <DropdownMenuLabel className="p-0">
          <div className="flex items-center gap-3 p-3 pb-2">
            <Avatar className="h-12 w-12 border-2 border-primary/20">
              {profile?.profileImage ? (
                <AvatarImage src={profile.profileImage} alt={profile.name} className="object-cover" />
              ) : null}
              <AvatarFallback className="bg-gradient-to-br from-primary to-[#7367F0] text-white">
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : profile ? (
                  getInitials(profile.name)
                ) : (
                  <User className="h-6 w-6" />
                )}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">
                {isLoading ? "Loading..." : profile?.name || "Investor"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {isLoading ? "..." : profile?.email || ""}
              </p>
              {profile?.isVerified && (
                <Badge variant="secondary" className="mt-1.5 bg-green-500/10 text-green-700 border-green-500/20 text-xs">
                  Verified Investor
                </Badge>
              )}
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer py-2.5">
            <UserCircle className="mr-3 h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="font-medium text-sm">My Profile</p>
              <p className="text-xs text-muted-foreground">View and edit profile</p>
            </div>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleLogout} 
          className="cursor-pointer py-2.5 text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <LogOut className="mr-3 h-4 w-4" />
          <div className="flex-1">
            <p className="font-medium text-sm">Log out</p>
            <p className="text-xs opacity-80">Sign out of your account</p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}