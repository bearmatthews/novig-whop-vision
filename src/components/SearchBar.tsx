import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}
export function SearchBar({
  value,
  onChange,
  placeholder = "Search teams..."
}: SearchBarProps) {
  return <div className="relative">
      
      
      {value && <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0" onClick={() => onChange("")}>
          <X className="w-4 h-4" />
        </Button>}
    </div>;
}