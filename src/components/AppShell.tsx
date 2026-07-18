import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Home,
  CalendarDays,
  Plus,
  BarChart3,
  Bot,
  ChevronDown,
  LogOut,
  User,
  Layers,
  CheckCircle2,
  AlertCircle,
  Users,
  PenSquare,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Brain,
  Library,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "@tanstack/react-router";
import { useAppStore } from "@/store/app-store";
import { useBrands, useCurrentBrand, useSetCurrentBrand, usePosts } from "@/hooks/use-api";
import { useCurrentWorkspace } from "@/hooks/use-current-workspace";
import { viewToPath } from "@/lib/steward-routes";
import { APP_NAME } from "@/config/brand";
import { AppLogo } from "@/components/AppLogo";
import { BackButton } from "@/components/BackButton";
import { supabase } from "@/lib/supabase";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface AppShellProps {
  children: React.ReactNode;
  pageTitle?: string;
  showBrandBanner?: boolean;
  showCreateButton?: boolean;
}

export function AppShell({
  children,
  pageTitle,
  showBrandBanner = false,
  showCreateButton = true,
}: AppShellProps) {
  const queryClient = useQueryClient();
  const { sidebarCollapsed, setSidebarCollapsed } = useAppStore();
  const { data: brandsData } = useBrands();
  const brands = brandsData?.brands || [];
  const { data: currentBrand } = useCurrentBrand();
  const setCurrentBrandMutation = useSetCurrentBrand();
  const { data: postsData } = usePosts();

  const activeBrandId = useAppStore((state) => state.activeBrandId);
  const isAllBrandsMode = activeBrandId === "all";
  const activeView = useAppStore((state) => state.activeView);
  const setActiveView = useAppStore((state) => state.setActiveView);
  const navigate = useNavigate();
  const workspace = useCurrentWorkspace();
  const profileEmail = workspace.profile?.email ?? workspace.user?.email ?? null;
  const profileName = workspace.profile?.fullName
    ?? workspace.profile?.displayName
    ?? profileEmail?.split("@")[0]
    ?? APP_NAME;
  const profileInitials = profileName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "S";

  const goToView = React.useCallback(
    (view: string) => {
      setActiveView(view);
      void navigate({ to: viewToPath(view) });
    },
    [navigate, setActiveView]
  );

  const handleLogout = React.useCallback(async () => {
    try {
      await supabase?.auth.signOut();
    } finally {
      localStorage.removeItem("steward_organization_id");
      localStorage.removeItem("steward_active_brand_id");
      toast.success("Signed out securely");
      void navigate({ to: "/login" });
    }
  }, [navigate]);

  const needsReview = (postsData?.posts ?? []).filter((p) =>
    ["pending", "pending_approval", "needs_review", "in_review"].includes(p.status),
  ).length;

  const primaryNav: NavItem[] = [
    { id: "dashboard", label: "Command Center", icon: Home },
    { id: "studio", label: "Create", icon: PenSquare },
    { id: "calendar", label: "Calendar", icon: CalendarDays },
    { id: "approvals", label: "Approvals", icon: ShieldCheck, badge: needsReview || undefined },
    { id: "assets", label: "Library", icon: Library },
    { id: "brand-intelligence", label: "Brand", icon: Brain },
    { id: "accounts", label: "Accounts", icon: Users },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "automations", label: "Automations", icon: Bot },
  ];

  const isRiskyActionPage = ["compose", "studio", "flight-ai", "autopilot", "queue", "approvals"].includes(
    activeView,
  );

  const handleBrandSwitch = async (brandId: string | "all") => {
    useAppStore.getState().setActiveBrandId(brandId);
    await queryClient.invalidateQueries();
    useAppStore.getState().setActiveView("dashboard");
    const brandName =
      brandId === "all" ? "All Brands" : brands.find((b) => b.id === brandId)?.name || "brand";
    toast.success(`Switched to ${brandName}`);
    if (brandId !== "all" && setCurrentBrandMutation) {
      setCurrentBrandMutation.mutate(brandId);
    }
  };

  const getCurrentBrandDisplay = () => {
    if (isAllBrandsMode) return { name: "All Brands", avatar: null, isViewOnly: true };
    const currentBrandName = currentBrand?.name?.trim();
    if (currentBrandName) {
      return { name: currentBrandName, avatar: currentBrand?.avatarUrl, isViewOnly: false };
    }
    const brand = brands.find((b) => b.id === activeBrandId);
    return {
      name: brand?.name?.trim() || "Select Brand",
      avatar: brand?.avatarUrl,
      isViewOnly: false,
    };
  };

  const brandDisplay = getCurrentBrandDisplay();

  const renderNavButton = (item: NavItem) => {
    const isActive = activeView === item.id;

    const inner = (
      <>
        <span
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
            isActive
              ? "bg-white/15 text-white shadow-sm ring-1 ring-white/20"
              : "text-slate-400 group-hover:bg-white/10 group-hover:text-white",
          )}
        >
          <item.icon className="h-5 w-5" />
        </span>
        {!sidebarCollapsed && (
          <span className="max-w-[5.5rem] text-center text-[10px] font-medium leading-tight text-slate-300">
            {item.label}
          </span>
        )}
        {item.badge !== undefined && item.badge > 0 && !sidebarCollapsed && (
          <Badge variant="destructive" className="absolute -right-0.5 -top-0.5 h-4 min-w-4 px-1 text-[9px]">
            {item.badge > 9 ? "9+" : item.badge}
          </Badge>
        )}
      </>
    );

    return (
      <TooltipProvider key={item.id}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => goToView(item.id)}
              className={cn(
                "group relative flex w-full flex-col items-center gap-1 rounded-lg px-1 py-2 transition-colors",
                isActive && "bg-muted/50",
              )}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              {inner}
            </button>
          </TooltipTrigger>
          {sidebarCollapsed && <TooltipContent side="right">{item.label}</TooltipContent>}
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className="flex h-screen bg-muted/40">
      <aside
        className={cn(
          "hidden flex-col border-r border-white/10 bg-[var(--steward-bg)] text-white transition-all duration-300 md:flex",
          sidebarCollapsed ? "w-[72px]" : "w-[104px]",
        )}
      >
        <div className="flex h-16 items-center justify-center border-b border-white/10 px-2">
          <AppLogo variant="mark" theme="light" size={34} />
        </div>

        <ScrollArea className="flex-1">
          <nav className="space-y-0.5 p-1.5">{primaryNav.map(renderNavButton)}</nav>
        </ScrollArea>

        <div className="border-t border-white/10 p-2">
          <Button
            variant="ghost"
            size="icon"
            className="mx-auto h-11 w-11 text-slate-300 hover:bg-white/10 hover:text-white"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border/60 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-6">
          <BackButton />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-11 max-w-[200px] gap-2 px-2.5">
                <Avatar className="h-6 w-6 shrink-0">
                  <AvatarImage src={brandDisplay.avatar || undefined} alt={brandDisplay.name} />
                  <AvatarFallback className="text-[10px]">
                    {isAllBrandsMode ? <Layers className="h-3 w-3" /> : brandDisplay.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate font-medium">{brandDisplay.name}</span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Switch brand</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {brands.slice(0, 6).map((brand) => (
                <DropdownMenuItem key={brand.id} onClick={() => handleBrandSwitch(brand.id)}>
                  <Avatar className="mr-2 h-6 w-6">
                    <AvatarImage src={brand.avatarUrl || undefined} />
                    <AvatarFallback className="text-xs">
                      {(brand.name?.trim() || "?").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1">{brand.name}</span>
                  {activeBrandId === brand.id && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleBrandSwitch("all")}>
                <Layers className="mr-2 h-4 w-4" /> All Brands (view only)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {pageTitle && <h2 className="hidden text-sm font-semibold text-muted-foreground sm:block">{pageTitle}</h2>}

          <div className="ml-auto flex items-center gap-2">
            {needsReview > 0 && (
              <Button variant="outline" size="sm" className="hidden h-11 sm:flex" onClick={() => goToView("approvals")}>
                <ShieldCheck className="mr-1.5 h-4 w-4" />
                {needsReview} review
              </Button>
            )}
            {showCreateButton && !["dashboard", "calendar", "studio"].includes(activeView) && (
              <Button size="sm" className="min-h-11" onClick={() => goToView("studio")}>
                <Plus className="mr-1.5 h-4 w-4" /> Create
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full" aria-label="Account menu">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={workspace.profile?.avatarUrl ?? undefined} alt={profileName} />
                    <AvatarFallback>
                      {profileInitials || <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <span className="block">{profileName}</span>
                  {profileEmail ? (
                    <span className="block truncate text-xs font-normal text-muted-foreground">
                      {profileEmail}
                    </span>
                  ) : null}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => goToView("brand-intelligence")}>
                  <Brain className="mr-2 h-4 w-4" /> Brand settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => goToView("accounts")}>
                  <Users className="mr-2 h-4 w-4" /> Connected accounts
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => void handleLogout()}>
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {showBrandBanner && isRiskyActionPage && (
          <Alert className="mx-4 mt-3 border-border/60 bg-muted/30 md:mx-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {isAllBrandsMode ? (
                <strong>All Brands (view only)</strong>
              ) : (
                <>
                  <strong>Active brand:</strong> {brandDisplay.name}
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        <main className="flex-1 overflow-auto bg-muted/30 p-4 pb-24 md:p-6">{children}</main>
      </div>

      <nav
        aria-label="Primary navigation"
        className="fixed inset-x-0 bottom-0 z-50 flex min-h-16 gap-1 overflow-x-auto border-t border-white/10 bg-[var(--steward-bg)] px-2 py-1.5 md:hidden"
      >
        {primaryNav.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => goToView(item.id)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex min-h-11 min-w-[64px] flex-col items-center justify-center gap-1 rounded-lg px-2 text-[10px] font-medium",
                isActive ? "bg-white/15 text-white" : "text-slate-400",
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
              {item.badge ? (
                <span className="absolute right-1 top-1 rounded-full bg-red-700 px-1 text-[9px] text-white">
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
