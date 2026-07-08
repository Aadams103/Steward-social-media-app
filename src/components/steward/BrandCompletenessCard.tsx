import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain } from "lucide-react";

export function BrandCompletenessCard({
  score,
  missingItems,
  onOpenBrand,
}: {
  score: number;
  missingItems: string[];
  onOpenBrand?: () => void;
}) {
  const pct = Math.min(100, Math.max(0, Math.round(score)));
  return (
    <Card className="border-border/70">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="h-4 w-4 text-primary" />
          Brand completeness
        </CardTitle>
        <CardDescription>What Steward knows before generating content.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Profile ready</span>
          <span className="font-semibold tabular-nums">{pct}%</span>
        </div>
        <Progress value={pct} className="h-2" />
        {missingItems.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {missingItems.slice(0, 6).map((item) => (
              <Badge key={item} variant="outline" className="text-[10px]">
                Missing: {item.replace(/_/g, " ")}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-xs text-emerald-700 dark:text-emerald-400">Core brand context is in place.</p>
        )}
        {onOpenBrand && (
          <Button variant="outline" size="sm" onClick={onOpenBrand}>
            Manage brand intelligence
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
