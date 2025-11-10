import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useWhopAuth } from "@/contexts/WhopAuthContext";
import { User } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
export function WhopUserProfile() {
  const {
    user,
    loading
  } = useWhopAuth();
  const isMobile = useIsMobile();

  // Show loading state briefly
  if (loading) {
    return <div className={`flex items-center gap-2 ${isMobile ? '' : 'mr-4'}`}>
        <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} rounded-full border-2 border-primary animate-pulse bg-secondary`} />
      </div>;
  }
  if (!user) {
    return null;
  }
  const initials = user.username ? user.username.substring(0, 2).toUpperCase() : user.email ? user.email.substring(0, 2).toUpperCase() : 'U';
  return <div className={`flex items-center gap-2 ${isMobile ? '' : 'mr-4'}`}>
      <Avatar className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} border-2 border-primary`}>
        <AvatarImage src={user.profile_pic_url} alt={user.username || 'User'} />
        <AvatarFallback className="bg-primary text-primary-foreground font-bold">
          {initials}
        </AvatarFallback>
      </Avatar>
      {user.username && !isMobile}
    </div>;
}