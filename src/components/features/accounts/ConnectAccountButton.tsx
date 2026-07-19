import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConnectAccountButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export function ConnectAccountButton({
  onClick,
  label = "Connect",
  className,
}: ConnectAccountButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn("shrink-0", className)}
      onClick={onClick}
    >
      {label === "Add platform" ? <Plus className="mr-1.5 size-4" /> : null}
      {label}
    </Button>
  );
}
