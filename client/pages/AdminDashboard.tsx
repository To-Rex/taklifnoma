import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { supabase } from "@/lib/supabase";
import {
  Shield,
  Users,
  CreditCard,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Eye,
  Check,
  X,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  UserPlus,
  Crown,
  Star,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DatabaseSetupGuide from "@/components/DatabaseSetupGuide";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PurchaseRequest {
  id: string;
  created_at: string;
  plan_type: string;
  full_name: string;
  email: string;
  phone: string;
  company_name: string | null;
  message: string | null;
  status: "pending" | "contacted" | "completed" | "rejected";
}

interface UserSubscription {
  id: string;
  user_id: string;
  plan_type: string;
  status: string;
  started_at: string | null;
  expires_at: string | null;
  price: number | null;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
}

interface DashboardStats {
  totalUsers: number;
  totalInvitations: number;
  totalSubscriptions: number;
  pendingRequests: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
}

export default function AdminDashboard() {
  const { adminUser, logout, isLoggedIn } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalInvitations: 0,
    totalSubscriptions: 0,
    pendingRequests: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
  });
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>(
    [],
  );
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [showDatabaseGuide, setShowDatabaseGuide] = useState(false);

  // Redirect if not logged in
  if (!isLoggedIn) {
    return <Navigate to="/admin" replace />;
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);

    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log("Admin dashboard loading timeout - stopping");
      setLoading(false);
    }, 8000); // 8 seconds timeout

    try {
      // Load statistics with timeout protection
      await Promise.race([
        Promise.all([loadStats(), loadPurchaseRequests(), loadSubscriptions()]),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Dashboard loading timeout")),
            7000,
          ),
        ),
      ]);

      clearTimeout(timeoutId);
    } catch (error: any) {
      console.error("Error loading dashboard data:", error.message || error);
      clearTimeout(timeoutId);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // First test if tables exist with a quick query
      const { error: testError } = await supabase
        .from("profiles")
        .select("id")
        .limit(1);

      if (testError && testError.message.includes("does not exist")) {
        console.log("Database tables not found, using demo data");
        setShowDatabaseGuide(true);
        setStats({
          totalUsers: 0,
          totalInvitations: parseInt(
            localStorage.getItem("demo_invitation_count") || "0",
          ),
          totalSubscriptions: 0,
          pendingRequests: 0,
          activeSubscriptions: 0,
          monthlyRevenue: 0,
        });
        return;
      }

      // If tables exist, load real data
      const [
        { count: usersCount },
        { count: invitationsCount },
        { count: subscriptionsCount },
        { count: pendingCount },
        { count: activeCount },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase
          .from("invitations")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("user_subscriptions")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("purchase_requests")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("user_subscriptions")
          .select("*", { count: "exact", head: true })
          .eq("status", "active"),
      ]);

      setStats({
        totalUsers: usersCount || 0,
        totalInvitations: invitationsCount || 0,
        totalSubscriptions: subscriptionsCount || 0,
        pendingRequests: pendingCount || 0,
        activeSubscriptions: activeCount || 0,
        monthlyRevenue: 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
      // Set demo/fallback stats on error
      setStats({
        totalUsers: 0,
        totalInvitations: parseInt(
          localStorage.getItem("demo_invitation_count") || "0",
        ),
        totalSubscriptions: 0,
        pendingRequests: 0,
        activeSubscriptions: 0,
        monthlyRevenue: 0,
      });
    }
  };

  const loadPurchaseRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("purchase_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        if (error.message.includes("does not exist")) {
          console.log("Purchase requests table not found, using empty data");
          setPurchaseRequests([]);
          return;
        }
        throw error;
      }
      setPurchaseRequests(data || []);
    } catch (error) {
      console.error("Error loading purchase requests:", error);
      setPurchaseRequests([]);
    }
  };

  const loadSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select(
          `
          *,
          profiles:user_id (
            first_name,
            last_name,
            email
          )
        `,
        )
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        if (error.message.includes("does not exist")) {
          console.log("Subscriptions table not found, using empty data");
          setSubscriptions([]);
          return;
        }
        throw error;
      }
      setSubscriptions(data || []);
    } catch (error) {
      console.error("Error loading subscriptions:", error);
      setSubscriptions([]);
    }
  };

  const updateRequestStatus = async (requestId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("purchase_requests")
        .update({
          status,
          processed_by: adminUser?.id,
          processed_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (error) throw error;

      // Reload purchase requests
      loadPurchaseRequests();
    } catch (error) {
      console.error("Error updating request status:", error);
    }
  };

  const getPlanBadge = (planType: string) => {
    const configs = {
      basic: { color: "bg-blue-100 text-blue-800", icon: "🆓" },
      premium: { color: "bg-purple-100 text-purple-800", icon: "⭐" },
      business: { color: "bg-yellow-100 text-yellow-800", icon: "👑" },
    };
    const config = configs[planType as keyof typeof configs] || configs.basic;
    return (
      <Badge className={config.color}>
        {config.icon} {planType.charAt(0).toUpperCase() + planType.slice(1)}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { color: "bg-yellow-100 text-yellow-800", text: "Kutilmoqda" },
      contacted: { color: "bg-blue-100 text-blue-800", text: "Bog'lanildi" },
      completed: { color: "bg-green-100 text-green-800", text: "Yakunlandi" },
      rejected: { color: "bg-red-100 text-red-800", text: "Rad etildi" },
      active: { color: "bg-green-100 text-green-800", text: "Faol" },
      cancelled: { color: "bg-red-100 text-red-800", text: "Bekor qilindi" },
      expired: { color: "bg-gray-100 text-gray-800", text: "Muddati tugagan" },
    };
    const config = configs[status as keyof typeof configs] || configs.pending;
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-muted-foreground">
            Dashboard yuklanmoqda...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  TaklifNoma Admin
                </h1>
                <p className="text-sm text-muted-foreground">
                  Boshqaruv paneli
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {adminUser?.full_name || adminUser?.username}
                </p>
                <p className="text-xs text-muted-foreground">
                  {adminUser?.role === "admin" ? "Bosh Admin" : "Manager"}
                </p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Link to="/" className="flex items-center w-full">
                      <Eye className="w-4 h-4 mr-2" />
                      Saytni ko'rish
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Chiqish
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Jami Foydalanuvchilar
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.totalUsers}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taklifnomalar</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.totalInvitations}
                </p>
              </div>
              <FileText className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Obunalar</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.totalSubscriptions}
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Kutilayotgan So'rovlar
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.pendingRequests}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Faol Obunalar</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.activeSubscriptions}
                </p>
              </div>
              <Crown className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Oylik Daromad</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.monthlyRevenue.toLocaleString()}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-none lg:flex">
            <TabsTrigger value="overview">Umumiy ko'rinish</TabsTrigger>
            <TabsTrigger value="purchase-requests">
              Sotib olish so'rovlari ({stats.pendingRequests})
            </TabsTrigger>
            <TabsTrigger value="subscriptions">Obunalar</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent Purchase Requests */}
              <div className="bg-card rounded-lg p-6 border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  So'nggi So'rovlar
                </h3>
                <div className="space-y-4">
                  {purchaseRequests.slice(0, 5).map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-3 border border-border rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          {request.full_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {getPlanBadge(request.plan_type)}
                        </p>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Subscriptions */}
              <div className="bg-card rounded-lg p-6 border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  So'nggi Obunalar
                </h3>
                <div className="space-y-4">
                  {subscriptions.slice(0, 5).map((subscription) => (
                    <div
                      key={subscription.id}
                      className="flex items-center justify-between p-3 border border-border rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          {subscription.profiles?.first_name || "Foydalanuvchi"}{" "}
                          {subscription.profiles?.last_name || ""}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {getPlanBadge(subscription.plan_type)}
                        </p>
                      </div>
                      {getStatusBadge(subscription.status)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="purchase-requests" className="mt-6">
            <div className="bg-card rounded-lg border border-border">
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">
                  Sotib Olish So'rovlari
                </h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mijoz</TableHead>
                    <TableHead>Reja</TableHead>
                    <TableHead>Bog'lanish</TableHead>
                    <TableHead>Sana</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead>Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{request.full_name}</p>
                          {request.company_name && (
                            <p className="text-sm text-muted-foreground">
                              {request.company_name}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getPlanBadge(request.plan_type)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-3 h-3" />
                            {request.phone}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-3 h-3" />
                            {request.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-3 h-3" />
                          {new Date(request.created_at).toLocaleDateString(
                            "uz-UZ",
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {request.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() =>
                                  updateRequestStatus(request.id, "contacted")
                                }
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Bog'lanildi
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateRequestStatus(request.id, "rejected")
                                }
                              >
                                <X className="w-3 h-3 mr-1" />
                                Rad etish
                              </Button>
                            </>
                          )}
                          {request.status === "contacted" && (
                            <Button
                              size="sm"
                              onClick={() =>
                                updateRequestStatus(request.id, "completed")
                              }
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Yakunlash
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="subscriptions" className="mt-6">
            <div className="bg-card rounded-lg border border-border">
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">
                  Foydalanuvchi Obunalari
                </h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Foydalanuvchi</TableHead>
                    <TableHead>Reja</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead>Boshlangan</TableHead>
                    <TableHead>Tugaydi</TableHead>
                    <TableHead>Narx</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {subscription.profiles?.first_name ||
                              "Foydalanuvchi"}{" "}
                            {subscription.profiles?.last_name || ""}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {subscription.profiles?.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getPlanBadge(subscription.plan_type)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(subscription.status)}
                      </TableCell>
                      <TableCell>
                        {subscription.started_at
                          ? new Date(
                              subscription.started_at,
                            ).toLocaleDateString("uz-UZ")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {subscription.expires_at
                          ? new Date(
                              subscription.expires_at,
                            ).toLocaleDateString("uz-UZ")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {subscription.price
                          ? `${subscription.price.toLocaleString()} so'm`
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Database Setup Guide */}
      <DatabaseSetupGuide
        isVisible={showDatabaseGuide}
        onDismiss={() => setShowDatabaseGuide(false)}
      />
    </div>
  );
}
