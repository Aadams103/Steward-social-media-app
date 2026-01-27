import * as React from "react";
import { useAppStore } from "@/store/app-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FileText,
  Search,
  User,
  Bot,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { AuditLogEntry } from "@/types/app";

export function AuditLogsSettings() {
  const { auditLog } = useAppStore();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterActor, setFilterActor] = React.useState<"all" | "user" | "autopilot">("all");

  const filteredLogs = auditLog.filter((entry) => {
    const matchesSearch =
      entry.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.resourceType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesActor = filterActor === "all" || entry.actorType === filterActor;
    return matchesSearch && matchesActor;
  });

  const getActorIcon = (actorType: AuditLogEntry["actorType"]) => {
    switch (actorType) {
      case "user":
        return <User className="h-4 w-4" />;
      case "autopilot":
        return <Bot className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle2 className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const formatAction = (action: string) => {
    return action
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Audit & Logs
          </CardTitle>
          <CardDescription>
            View a complete history of actions taken in your account, including both human and AI actions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="actor-filter">Actor Type</Label>
              <select
                id="actor-filter"
                value={filterActor}
                onChange={(e) => setFilterActor(e.target.value as "all" | "user" | "autopilot")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="all">All Actors</option>
                <option value="user">Human Actions</option>
                <option value="autopilot">AI Actions</option>
              </select>
            </div>
          </div>

          {/* Logs List */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No audit logs found
              </p>
            ) : (
              filteredLogs.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="mt-0.5">
                    {getActorIcon(entry.actorType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{formatAction(entry.action)}</p>
                      <Badge variant="outline" className="text-xs">
                        {entry.resourceType}
                      </Badge>
                      {getStatusIcon(entry.success)}
                    </div>
                    <p className="text-sm text-muted-foreground">{entry.details}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(entry.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
