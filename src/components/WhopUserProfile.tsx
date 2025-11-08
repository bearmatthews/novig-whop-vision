import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useWhopAuth } from "@/contexts/WhopAuthContext";
import { User } from "lucide-react";

export function WhopUserProfile() {
  const { user, loading } = useWhopAuth();

  if (loading || !user) {
    return null;
  }

  const initials = user.username
    ? user.username.substring(0, 2).toUpperCase()
    : user.email
    ? user.email.substring(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="flex items-center gap-2 mr-4">
      <Avatar className="w-10 h-10 border-2 border-primary">
        <AvatarImage src={user.profile_picture_url} alt={user.username || 'User'} />
        <AvatarFallback>
          {user.profile_picture_url ? <User className="w-5 h-5" /> : initials}
        </AvatarFallback>
      </Avatar>
      {user.username && (
        <span className="text-sm font-medium hidden sm:inline">{user.username}</span>
      )}
    </div>
  );
}