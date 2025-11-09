import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useWhopAuth } from "@/contexts/WhopAuthContext";
import { User } from "lucide-react";

export function WhopUserProfile() {
  const { user, loading } = useWhopAuth();

  // Show loading state briefly
  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-primary animate-pulse bg-secondary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const initials = user.username
    ? user.username.substring(0, 2).toUpperCase()
    : user.email
    ? user.email.substring(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="flex items-center gap-2">
      <Avatar className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-primary flex-shrink-0">
        <AvatarImage src={user.profile_picture_url} alt={user.username || 'User'} />
        <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs sm:text-sm">
          {initials}
        </AvatarFallback>
      </Avatar>
      {user.username && (
        <span className="text-xs sm:text-sm font-medium hidden sm:inline truncate max-w-[100px] md:max-w-[150px]">{user.username}</span>
      )}
    </div>
  );
}