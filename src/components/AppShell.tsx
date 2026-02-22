import * as React from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  LayoutDashboard,
  PenSquare,
  Calendar,
  Inbox,
  BarChart3,
  Users,
  Megaphone,
  Image,
  Settings,
  Bot,
  ClipboardList,
  Bell,
  ChevronDown,
  LogOut,
  User,
  CreditCard,
  Plus,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Layers,
  CheckCircle2,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
import { useBrands, useCurrentBrand, useSetCurrentBrand } from "@/hooks/use-api";
import { APP_NAME } from "@/config/brand";
import { AppLogo } from "@/components/AppLogo";
import { BackButton } from "@/components/BackButton";
import { SettingsOverlay, type SettingsSectionId } from "@/components/SettingsOverlay";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  path: string;
}

interface AppShellProps {
  children: React.ReactNode;
  pageTitle?: string;
  showBrandBanner?: boolean;
  createButtonLabel?: string;
  onCreateClick?: () => void;
}

export function AppShell({
  children,
  pageTitle,
  showBrandBanner = false,
  createButtonLabel,
  onCreateClick,
}: AppShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { sidebarCollapsed, setSidebarCollapsed, conversations, autopilotNotifications } = useAppStore();
  const { data: brandsData } = useBrands();
  const brands = brandsData?.brands || [];
  const { data: currentBrand } = useCurrentBrand();
  const setCurrentBrandMutation = useSetCurrentBrand();

  const activeBrandId = useAppStore((state) => state.activeBrandId);
  const isAllBrandsMode = activeBrandId === "all";

  // Settings overlay state
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [settingsSection, setSettingsSection] = React.useState<SettingsSectionId>("my-account");

  const openSettings = React.useCallback((section?: SettingsSectionId) => {
    if (section) {
      setSettingsSection(section);
    }
    setSettingsOpen(true);
  }, []);

  // Calculate badges
  const unreadCount = conversations.filter((c) => c.status === "unread").length;
  const pendingApprovals = autopilotNotifications.filter(
    (n) => n.type === "pending_approval" && !n.isActioned
  ).length;

  // Get activeView from store for view-based navigation
  const activeView = useAppStore((state) => state.activeView);
  const setActiveView = useAppStore((state) => state.setActiveView);

  // Navigation items - using view-based navigation for now
  const navItems: NavItem[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/" },
    { id: "autopilot", label: "Autopilot", icon: Bot, badge: pendingApprovals, path: "/autopilot" },
    { id: "email", label: "Email", icon: Mail, path: "/email" },
    { id: "compose", label: "Compose", icon: PenSquare, path: "/compose" },
    { id: "queue", label: "Queue", icon: ClipboardList, path: "/queue" },
    { id: "calendar", label: "Calendar", icon: Calendar, path: "/calendar" },
    { id: "inbox", label: "Inbox", icon: Inbox, badge: unreadCount, path: "/inbox" },
    { id: "analytics", label: "Analytics", icon: BarChart3, path: "/analytics" },
    { id: "campaigns", label: "Campaigns", icon: Megaphone, path: "/campaigns" },
    { id: "assets", label: "Assets", icon: Image, path: "/assets" },
    { id: "accounts", label: "Accounts", icon: Users, path: "/accounts" },
  ];

  // Determine if current page is a risky action page (using view-based navigation)
  const isRiskyActionPage = ["compose", "autopilot", "queue"].includes(activeView);

  // Handle brand switching
  const handleBrandSwitch = async (brandId: string | "all") => {
    useAppStore.getState().setActiveBrandId(brandId);
    
    // Invalidate React Query cache
    await queryClient.invalidateQueries();
    
    // Navigate to dashboard (view-based)
    useAppStore.getState().setActiveView("dashboard");
    
    // Show toast
    const brandName = brandId === "all" 
      ? "All Brands" 
      : brands.find((b) => b.id === brandId)?.name || "brand";
    toast.success(`Switched to ${brandName}`);
    
    // If using API hook, update current brand
    if (brandId !== "all" && setCurrentBrandMutation) {
      setCurrentBrandMutation.mutate(brandId);
    }
  };

  // Get current brand display info
  const getCurrentBrandDisplay = () => {
    if (isAllBrandsMode) {
      return { name: "All Brands", avatar: null, isViewOnly: true };
    }
    
    if (currentBrand) {
      return {
        name: currentBrand.name,
        avatar: currentBrand.avatarUrl,
        isViewOnly: false,
      };
    }
    
    // Fallback to store state
    const brand = brands.find((b) => b.id === activeBrandId);
    return {
      name: brand?.name || "Select Brand",
      avatar: brand?.avatarUrl,
      isViewOnly: false,
    };
  };

  const brandDisplay = getCurrentBrandDisplay();

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo/Brand */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4 gap-3">
          {sidebarCollapsed ? (
            <div className="flex flex-1 items-center justify-center min-w-0">
              <AppLogo 
                variant="mark" 
                theme="light" 
                size={32} 
                brandLogoUrl={currentBrand?.logoUrl}
                className="opacity-100"
              />
            </div>
          ) : (
            <div className="flex flex-1 items-center min-w-0">
              <AppLogo 
                variant="lockup" 
                theme="light" 
                size={32} 
                brandLogoUrl={currentBrand?.logoUrl}
                className="opacity-100"
              />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1">
          <nav className="p-2 space-y-1">
            {navItems.map((item) => {
              // Use view-based navigation for now
              const isActive = activeView === item.id;
              
              return (
                <TooltipProvider key={item.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setActiveView(item.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                          isActive
                            ? "bg-sidebar-primary text-sidebar-primary-foreground"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        {!sidebarCollapsed && (
                          <>
                            <span className="flex-1 text-left">{item.label}</span>
                            {item.badge !== undefined && item.badge > 0 && (
                              <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                                {item.badge}
                              </Badge>
                            )}
                          </>
                        )}
                      </button>
                    </TooltipTrigger>
                    {sidebarCollapsed && (
                      <TooltipContent side="right">
                        {item.label}
                        {item.badge !== undefined && item.badge > 0 && ` (${item.badge})`}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Version (pinned at bottom, opens Settings overlay) */}
        <div className="border-t border-sidebar-border px-3 py-2">
          <button
            type="button"
            onClick={() => openSettings("my-account")}
            className={cn(
              "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-[11px] font-medium tracking-tight text-sidebar-foreground/80 transition-colors",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            {!sidebarCollapsed && (
              <>
                <span className="truncate">{APP_NAME}</span>
                <span className="ml-2 font-mono text-[10px] opacity-80">v0.1.0</span>
              </>
            )}
            {sidebarCollapsed && (
              <span className="mx-auto font-mono text-[10px] opacity-80">v0.1.0</span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border/50 bg-background px-6">
          <BackButton />
          {/* Brand Switcher */}
          <div className="flex items-center gap-4 flex-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-9 gap-2 px-3"
                >
                  <Avatar className="h-5 w-5 shrink-0">
                    <AvatarImage 
                      src={brandDisplay.avatar || undefined} 
                      alt={brandDisplay?.name ?? ""}
                      onError={(e) => {
                        // Hide broken image, fallback will show
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <AvatarFallback className="text-xs font-medium">
                      {isAllBrandsMode ? (
                        <Layers className="h-3 w-3" />
                      ) : (
                        (() => {
                          const name = (brandDisplay?.name ?? "").trim();
                          const words = name.split(/\s+/);
                          return words.length >= 2
                            ? (words[0][0] + words[1][0]).toUpperCase()
                            : name.charAt(0).toUpperCase();
                        })()
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{brandDisplay?.name ?? ""}</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Switch Brand</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {brands.slice(0, 6).map((brand) => {
                  const isActive = activeBrandId === brand.id;
                  // Get initials (first letter, or first two letters if single word)
                  const getInitials = (n: string | undefined) => {
                    const safe = (n ?? "").trim();
                    const words = safe.split(/\s+/);
                    if (words.length >= 2) {
                      return (words[0][0] + words[1][0]).toUpperCase();
                    }
                    return safe.charAt(0).toUpperCase();
                  };
                  
                  return (
                    <DropdownMenuItem
                      key={brand.id}
                      onClick={() => handleBrandSwitch(brand.id)}
                      className={cn(
                        "flex items-center gap-2",
                        isActive && "bg-accent"
                      )}
                    >
                      <Avatar className="h-6 w-6 shrink-0">
                        <AvatarImage 
                          src={brand.avatarUrl || undefined} 
                          alt={brand.name}
                          onError={(e) => {
                            // Hide broken image, fallback will show
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <AvatarFallback className="text-xs font-medium">
                          {getInitials(brand.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="flex-1">{brand.name}</span>
                      {isActive && (
                        <CheckCircle2 className="h-4 w-4 text-sidebar-primary shrink-0" />
                      )}
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleBrandSwitch("all")}
                  className={cn(
                    "flex items-center gap-2",
                    isAllBrandsMode && "bg-accent"
                  )}
                >
                  <div className="h-6 w-6 shrink-0 rounded-full bg-muted flex items-center justify-center">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="flex-1">All Brands (View Only)</span>
                  {isAllBrandsMode && (
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => openSettings("my-brand")}
                  className="flex items-center gap-2"
                >
                  <Layers className="h-4 w-4" />
                  <span>Manage Brand Settings</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Page Title */}
            {pageTitle && (
              <h2 className="text-lg font-semibold">{pageTitle}</h2>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Create Button */}
            {createButtonLabel && onCreateClick && (
              <Button
                onClick={onCreateClick}
                disabled={isAllBrandsMode && isRiskyActionPage}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                {createButtonLabel}
              </Button>
            )}

            {/* Notifications */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {pendingApprovals > 0 && (
                      <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Notifications</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => openSettings("my-account")}>
                  <User className="h-4 w-4 mr-2" />
                  My Account
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openSettings("my-steward")}>
                  <Bot className="h-4 w-4 mr-2" />
                  My Steward
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openSettings("billing")}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openSettings("support")}>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Help & Support
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Brand Safety Banner */}
        {showBrandBanner && isRiskyActionPage && (
          <Alert className="mx-6 mt-4 border-border/60 bg-muted/30">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <AlertDescription className="text-foreground">
              {isAllBrandsMode ? (
                <span>
                  <strong>All Brands (View Only)</strong> — Select a brand to create or publish content.
                </span>
              ) : (
                <span>
                  <strong>Active Brand:</strong> {brandDisplay?.name ?? ""}
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
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
