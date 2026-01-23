import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect } from "react";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

/**
 * Persistent Back button: real history when possible, fallback detail→list.
 * Preserves context (filters, scroll, selected org). Keyboard: Alt+Left, Cmd+[
 */
export function BackButton() {
  const { setActiveView, selectedConversation, setSelectedConversation, editingPost, setEditingPost } =
    useAppStore();

  const handleBack = useCallback(() => {
    if (selectedConversation) {
      setSelectedConversation(null);
      return;
    }
    if (editingPost) {
      setEditingPost(null);
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
      return;
    }
    setActiveView("dashboard");
  }, [selectedConversation, editingPost, setSelectedConversation, setEditingPost, setActiveView]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.altKey && e.key === "ArrowLeft") || (e.metaKey && e.key === "[")) {
        e.preventDefault();
        handleBack();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleBack]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={handleBack}
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          Back (Alt+Left / Cmd+[)
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
