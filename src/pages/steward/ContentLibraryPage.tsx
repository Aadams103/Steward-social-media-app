import * as React from "react";
import { format } from "date-fns";
import { Image, LayoutGrid, List, Search, Sparkles, Upload } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { useAssets, useUploadAssets } from "@/hooks/use-api";
import { UploadDropzone } from "@/components/uploads/UploadDropzone";
import { StewardEmptyState, StatusChip } from "@/components/steward";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

export function ContentLibraryPage() {
  const setActiveView = useAppStore((s) => s.setActiveView);
  const { data, isLoading, refetch } = useAssets();
  const upload = useUploadAssets();

  const [view, setView] = React.useState<"grid" | "list">("grid");
  const [query, setQuery] = React.useState("");

  const assets = (data?.assets ?? []).filter((a) =>
    (a.fileName ?? "").toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-[1280px] space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Content Library</h1>
          <p className="text-sm text-muted-foreground">Media, AI analysis status, and reuse across posts.</p>
        </div>
        <Button onClick={() => setActiveView("studio")}>
          <Sparkles className="mr-2 h-4 w-4" />
          Create from asset
        </Button>
      </div>

      <UploadDropzone
        accept="image/*,video/*"
        onFilesSelected={(files) => void upload.mutateAsync({ files }).then(() => refetch())}
        title="Upload media"
        helperText="Drag and drop or click to browse"
        isUploading={upload.isPending}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search assets…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Tabs value={view} onValueChange={(v) => setView(v as "grid" | "list")}>
          <TabsList>
            <TabsTrigger value="grid">
              <LayoutGrid className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="list">
              <List className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <LoadingSkeleton className="h-64 w-full" />
      ) : assets.length === 0 ? (
        <StewardEmptyState
          icon={Upload}
          title="No content in your library yet"
          description="Upload photos or videos and Steward can analyze them and turn them into draft posts."
          actionLabel="Upload media"
          onAction={() => document.querySelector<HTMLInputElement>('[type="file"]')?.click()}
        />
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {assets.map((asset) => (
            <Card key={asset.id} className="overflow-hidden border-border/70">
              <div className="aspect-square bg-muted">
                {asset.url ? (
                  <img src={asset.url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Image className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <CardContent className="space-y-2 p-3">
                <p className="truncate text-sm font-medium">{asset.fileName ?? "Untitled"}</p>
                <div className="flex flex-wrap gap-1">
                  <StatusChip label={asset.mimeType?.startsWith("video") ? "Video" : "Image"} tone="muted" />
                  <StatusChip label="Not analyzed" tone="info" />
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="secondary" className="flex-1 text-xs" onClick={() => setActiveView("studio")}>
                    Create post
                  </Button>
                </div>
                {asset.createdAt && (
                  <p className="text-[10px] text-muted-foreground">
                    {format(new Date(asset.createdAt), "MMM d, yyyy")}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="flex items-center justify-between rounded-lg border border-border/60 bg-background p-3"
            >
              <div>
                <p className="font-medium">{asset.fileName}</p>
                <p className="text-xs text-muted-foreground">{asset.mimeType}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setActiveView("studio")}>
                Create post
              </Button>
            </div>
          ))}
        </div>
      )}

      {upload.isPending && <p className="text-sm text-muted-foreground">Uploading…</p>}
    </div>
  );
}
