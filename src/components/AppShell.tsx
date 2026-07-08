import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Home,
  CalendarDays,
  Plus,
  Inbox,
  BarChart3,
  Megaphone,
  Bot,
  MoreHorizontal,
  Bell,
  ChevronDown,
  LogOut,
  User,
  CreditCard,
  Layers,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Settings,
  Users,
  Image,
  ClipboardList,
  PenSquare,
  History,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Brain,
  Library,
  Activity,
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
import { useAppStore } from "@/store/app-store";
import { useBrands, useCurrentBrand, useSetCurrentBrand, usePosts } from "@/hooks/use-api";
import { APP_NAME } from "@/config/brand";
import { AppLogo } from "@/components/AppLogo";
import { BackButton } from "@/components/BackButton";
import { SettingsOverlay, type SettingsSectionId } from "@/components/SettingsOverlay";
import { CreateMenu, CreatePostButton } from "@/components/create/CreateMenu";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  isCreate?: boolean;
}

interface AppShellProps {
  children: React.ReactNode;
  pageTitle?: string;
  showBrandBanner?: boolean;
  showCreateButton?: boolean;
}

const MORE_VIEWS = [
  "settings",
  "accounts",
  "assets",
  "compose",
  "email",
  "brand",
  "audit",
  "inbox",
  "queue",
  "flight-ai",
  "compose",
];

export function AppShell({
  children,
  pageTitle,
  showBrandBanner = false,
  showCreateButton = true,
}: AppShellProps) {
  const queryClient = useQueryClient();
  const { sidebarCollapsed, setSidebarCollapsed, conversations } = useAppStore();
  const { data: brandsData } = useBrands();
  const brands = brandsData?.brands || [];
  const { data: currentBrand } = useCurrentBrand();
  const setCurrentBrandMutation = useSetCurrentBrand();
  const { data: postsData } = usePosts();

  const activeBrandId = useAppStore((state) => state.activeBrandId);
  const isAllBrandsMode = activeBrandId === "all";
  const activeView = useAppStore((state) => state.activeView);
  const setActiveView = useAppStore((state) => state.setActiveView);

  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [settingsSection, setSettingsSection] = React.useState<SettingsSectionId>("my-account");

  const openSettings = React.useCallback((section?: SettingsSectionId) => {
    if (section) setSettingsSection(section);
    setSettingsOpen(true);
  }, []);

  const unreadCount = conversations.filter((c) => c.status === "unread").length;
  const needsReview = (postsData?.posts ?? []).filter((p) =>
    ["pending", "pending_approval", "needs_review", "draft"].includes(p.status),
  ).length;

  const primaryNav: NavItem[] = [
    { id: "dashboard", label: "Command", icon: Home },
    { id: "studio", label: "Create", icon: PenSquare },
    { id: "assets", label: "Library", icon: Library },
    { id: "calendar", label: "Calendar", icon: CalendarDays },
    { id: "approvals", label: "Approvals", icon: ShieldCheck, badge: needsReview || undefined },
    { id: "campaigns", label: "Campaigns", icon: Megaphone },
    { id: "autopilot", label: "Autopilot", icon: Bot },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "brand-intelligence", label: "Brand", icon: Brain },
    { id: "accounts", label: "Accounts", icon: Users },
    { id: "ai-activity", label: "AI", icon: Activity },
    { id: "more", label: "More", icon: MoreHorizontal },
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
    if (currentBrand) {
      return { name: currentBrand.name, avatar: currentBrand.avatarUrl, isViewOnly: false };
    }
    const brand = brands.find((b) => b.id === activeBrandId);
    return { name: brand?.name || "Select Brand", avatar: brand?.avatarUrl, isViewOnly: false };
  };

  const brandDisplay = getCurrentBrandDisplay();

  const renderNavButton = (item: NavItem) => {
    const isActive =
      item.id === "more"
        ? MORE_VIEWS.includes(activeView)
        : activeView === item.id;

    const inner = (
      <>
        <span
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
            isActive
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground group-hover:bg-muted group-hover:text-foreground",
          )}
        >
          <item.icon className="h-5 w-5" />
        </span>
        {!sidebarCollapsed && (
          <span className="max-w-[4.5rem] truncate text-center text-[10px] font-medium leading-tight">
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

    if (item.id === "more") {
      return (
        <DropdownMenu key={item.id}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "group relative flex w-full flex-col items-center gap-1 rounded-lg px-1 py-2 transition-colors",
                isActive && "bg-muted/50",
              )}
              aria-label="More navigation"
            >
              {inner}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="w-52">
            <DropdownMenuItem onClick={() => setActiveView("flight-ai")}>
              <Sparkles className="mr-2 h-4 w-4" /> Flight AI
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveView("compose")}>
              <PenSquare className="mr-2 h-4 w-4" /> Legacy compose
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveView("inbox")}>
              <Inbox className="mr-2 h-4 w-4" /> Inbox
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {unreadCount}
                </Badge>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveView("queue")}>
              <ClipboardList className="mr-2 h-4 w-4" /> Listening queue
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveView("automations")}>
              <Bot className="mr-2 h-4 w-4" /> Automations
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setActiveView("brand")}>
              <Image className="mr-2 h-4 w-4" /> Brand profile (legacy)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveView("audit")}>
              <History className="mr-2 h-4 w-4" /> Audit log
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => openSettings("my-account")}>
              <Settings className="mr-2 h-4 w-4" /> Settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return (
      <TooltipProvider key={item.id}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setActiveView(item.id)}
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
          "flex flex-col border-r border-border/70 bg-background transition-all duration-300",
          sidebarCollapsed ? "w-[72px]" : "w-[88px]",
        )}
      >
        <div className="flex h-14 items-center justify-center border-b border-border/60 px-2">
          <AppLogo variant="mark" theme="dark" size={28} brandLogoUrl={currentBrand?.logoUrl} />
        </div>

        <ScrollArea className="flex-1">
          <nav className="space-y-0.5 p-1.5">{primaryNav.map(renderNavButton)}</nav>
        </ScrollArea>

        <div className="border-t border-border/60 p-2">
          <Button
            variant="ghost"
            size="icon"
            className="mx-auto h-8 w-8"
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
              <Button variant="outline" size="sm" className="h-9 max-w-[200px] gap-2 px-2.5">
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
                    <AvatarFallback className="text-xs">{brand.name.charAt(0)}</AvatarFallback>
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
              <Button variant="outline" size="sm" className="hidden h-9 sm:flex" onClick={() => setActiveView("approvals")}>
                <ShieldCheck className="mr-1.5 h-4 w-4" />
                {needsReview} review
              </Button>
            )}
            {showCreateButton && !["dashboard", "calendar", "studio"].includes(activeView) && (
              <CreatePostButton size="sm" />
            )}
            <Button variant="ghost" size="icon" className="relative h-9 w-9" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" aria-label="Account menu">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{APP_NAME}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => openSettings("my-account")}>
                  <User className="mr-2 h-4 w-4" /> My Account
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openSettings("billing")}>
                  <CreditCard className="mr-2 h-4 w-4" /> Billing
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
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

        <main className="flex-1 overflow-auto bg-muted/30 p-4 md:p-6">{children}</main>
      </div>

      <SettingsOverlay
        open={settingsOpen}
        section={settingsSection}
        onOpenChange={setSettingsOpen}
        onSectionChange={setSettingsSection}
      />
    </div>
  );
}
