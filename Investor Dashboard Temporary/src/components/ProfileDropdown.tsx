import { User, LogOut, UserCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup } from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";
import { toast } from "sonner";

interface ProfileDropdownProps {
  onNavigate?: (page: string) => void;
}

export function ProfileDropdown({ onNavigate }: ProfileDropdownProps) {
  const handleProfileClick = () => {
    if (onNavigate) {
      onNavigate("profile");
    }
  };

  const handleLogout = () => {
    toast.success("Logged out successfully", {
      description: "See you next time!"
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all">
          <Avatar className="h-9 w-9 border-2 border-primary/20 cursor-pointer hover:border-primary/40 transition-colors">
            <AvatarFallback className="bg-gradient-to-br from-primary to-[#7367F0] text-white">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72" align="end">
        <DropdownMenuLabel className="p-0">
          <div className="flex items-center gap-3 p-3 pb-2">
            <Avatar className="h-12 w-12 border-2 border-primary/20">
              <AvatarFallback className="bg-gradient-to-br from-primary to-[#7367F0] text-white">
                <User className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">John Investor</p>
              <p className="text-xs text-muted-foreground truncate">john.investor@rentmates.com</p>
              <Badge variant="secondary" className="mt-1.5 bg-primary/10 text-primary border-primary/20 text-xs">
                Premium Member
              </Badge>
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