import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Plus,
  MoreVertical,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Download,
  Filter,
  ArrowUpDown,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  package: "Starter" | "Professional" | "Enterprise";
  status: "discovery" | "design" | "build" | "launch" | "completed" | "paused";
  progress: number;
  startDate: string;
  launchDate: string;
  totalValue: number;
  paidAmount: number;
  successManager: string;
  lastActivity: string;
  notes: string;
}

/** Map a raw Supabase row (snake_case) into our Client shape. */
function mapRowToClient(row: Record<string, unknown>): Client {
  const updatedAt = row.updated_at as string | null;
  return {
    id: row.id as string,
    name: (row.name as string) ?? "",
    email: (row.email as string) ?? "",
    phone: (row.phone as string) ?? "",
    company: (row.company as string) ?? "",
    package: (row.package as Client["package"]) ?? "Starter",
    status: (row.status as Client["status"]) ?? "discovery",
    progress: (row.progress as number) ?? 0,
    startDate: (row.start_date as string) ?? "",
    launchDate: (row.launch_date as string) ?? "",
    totalValue: Number(row.total_value ?? 0),
    paidAmount: Number(row.paid_amount ?? 0),
    successManager: (row.success_manager as string) ?? "",
    lastActivity: updatedAt
      ? formatDistanceToNow(new Date(updatedAt), { addSuffix: true })
      : "N/A",
    notes: (row.notes as string) ?? "",
  };
}

const AdminClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPackage, setFilterPackage] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // -- Add Client form state --
  const [newName, setNewName] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPackage, setNewPackage] = useState("");
  const [newManager, setNewManager] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newLaunchDate, setNewLaunchDate] = useState("");
  const [newNotes, setNewNotes] = useState("");

  // ----------------------------------------------------------------
  // Fetch clients from Supabase
  // ----------------------------------------------------------------
  const fetchClients = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase
      .from("clients" as any)
      .select("*") as any);

    if (error) {
      console.error("Error fetching clients:", error);
      toast.error("Failed to load clients. Please try again.");
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as Record<string, unknown>[];
    setClients(rows.map(mapRowToClient));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // ----------------------------------------------------------------
  // Computed stats
  // ----------------------------------------------------------------
  const stats = useMemo(
    () => ({
      totalClients: clients.length,
      activeProjects: clients.filter(
        (c) => c.status !== "completed" && c.status !== "paused"
      ).length,
      totalRevenue: clients.reduce((sum, c) => sum + c.paidAmount, 0),
      pendingRevenue: clients.reduce(
        (sum, c) => sum + (c.totalValue - c.paidAmount),
        0
      ),
    }),
    [clients]
  );

  // ----------------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------------
  const getStatusBadge = (status: Client["status"]) => {
    const statusConfig = {
      discovery: { label: "Discovery", variant: "secondary" as const },
      design: { label: "Design", variant: "secondary" as const },
      build: { label: "Build", variant: "default" as const },
      launch: { label: "Launch", variant: "default" as const },
      completed: { label: "Completed", variant: "outline" as const },
      paused: { label: "Paused", variant: "destructive" as const },
    };
    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPackageBadge = (pkg: Client["package"]) => {
    const colors = {
      Starter: "bg-blue-500/10 text-blue-500",
      Professional: "bg-purple-500/10 text-purple-500",
      Enterprise: "bg-amber-500/10 text-amber-500",
    };
    return <Badge className={colors[pkg]}>{pkg}</Badge>;
  };

  // ----------------------------------------------------------------
  // Filtering
  // ----------------------------------------------------------------
  const filteredClients = useMemo(
    () =>
      clients.filter((client) => {
        const matchesSearch =
          client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client.company.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPackage =
          filterPackage === "all" || client.package === filterPackage;
        const matchesStatus =
          filterStatus === "all" || client.status === filterStatus;
        return matchesSearch && matchesPackage && matchesStatus;
      }),
    [clients, searchQuery, filterPackage, filterStatus]
  );

  // ----------------------------------------------------------------
  // Add Client handler
  // ----------------------------------------------------------------
  const handleAddClient = async () => {
    if (!newName || !newEmail) {
      toast.error("Name and email are required.");
      return;
    }

    setIsSubmitting(true);

    const packageValueMap: Record<string, number> = {
      Starter: 25000,
      Professional: 50000,
      Enterprise: 100000,
    };

    const insertPayload: Record<string, unknown> = {
      name: newName,
      email: newEmail,
      phone: newPhone || null,
      company: newCompany || null,
      package: newPackage || null,
      status: "discovery",
      progress: 0,
      start_date: newStartDate || null,
      launch_date: newLaunchDate || null,
      total_value: packageValueMap[newPackage] ?? 0,
      paid_amount: 0,
      success_manager: newManager || null,
      notes: newNotes || null,
    };

    const { error } = await (supabase
      .from("clients" as any)
      .insert(insertPayload) as any);

    setIsSubmitting(false);

    if (error) {
      console.error("Error inserting client:", error);
      toast.error("Failed to add client. Please try again.");
      return;
    }

    toast.success("Client added successfully!");
    setIsAddClientOpen(false);

    // Reset form
    setNewName("");
    setNewCompany("");
    setNewEmail("");
    setNewPhone("");
    setNewPackage("");
    setNewManager("");
    setNewStartDate("");
    setNewLaunchDate("");
    setNewNotes("");

    // Refresh list
    fetchClients();
  };

  // ----------------------------------------------------------------
  // Delete Client handler
  // ----------------------------------------------------------------
  const handleDeleteClient = async (clientId: string, clientName: string) => {
    const { error } = await (supabase
      .from("clients" as any)
      .delete()
      .eq("id", clientId) as any);

    if (error) {
      console.error("Error deleting client:", error);
      toast.error("Failed to delete client. Please try again.");
      return;
    }

    toast.success(`Client "${clientName}" has been deleted.`);
    fetchClients();
  };

  // ----------------------------------------------------------------
  // Export CSV handler
  // ----------------------------------------------------------------
  const handleExport = () => {
    if (filteredClients.length === 0) {
      toast.error("No clients to export.");
      return;
    }

    const headers = [
      "Name",
      "Email",
      "Phone",
      "Company",
      "Package",
      "Status",
      "Progress",
      "Start Date",
      "Launch Date",
      "Total Value",
      "Paid Amount",
      "Success Manager",
      "Last Activity",
    ];

    const csvRows = filteredClients.map((c) =>
      [
        `"${c.name}"`,
        `"${c.email}"`,
        `"${c.phone}"`,
        `"${c.company}"`,
        `"${c.package}"`,
        `"${c.status}"`,
        c.progress,
        `"${c.startDate}"`,
        `"${c.launchDate}"`,
        c.totalValue,
        c.paidAmount,
        `"${c.successManager}"`,
        `"${c.lastActivity}"`,
      ].join(",")
    );

    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lumen-orca-clients-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredClients.length} client(s) to CSV.`);
  };

  // ----------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Client Management</h1>
          <p className="text-muted-foreground">Manage all your client projects</p>
        </div>
        <Dialog open={isAddClientOpen} onOpenChange={setIsAddClientOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>
                Create a new client project. Fill in the details below.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    placeholder="John Smith"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input
                    placeholder="Smith Consulting"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    placeholder="+1 555-0100"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Package</Label>
                  <Select value={newPackage} onValueChange={setNewPackage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select package" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Starter">Starter ($25K)</SelectItem>
                      <SelectItem value="Professional">Professional ($50K)</SelectItem>
                      <SelectItem value="Enterprise">Enterprise ($100K)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Success Manager</Label>
                  <Select value={newManager} onValueChange={setNewManager}>
                    <SelectTrigger>
                      <SelectValue placeholder="Assign manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sarah Chen">Sarah Chen</SelectItem>
                      <SelectItem value="Mike Ross">Mike Ross</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Target Launch Date</Label>
                  <Input
                    type="date"
                    value={newLaunchDate}
                    onChange={(e) => setNewLaunchDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Any additional notes about this client..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddClientOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddClient} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Client
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalClients}</div>
                <div className="text-sm text-muted-foreground">Total Clients</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.activeProjects}</div>
                <div className="text-sm text-muted-foreground">Active Projects</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">${(stats.totalRevenue / 1000).toFixed(0)}K</div>
                <div className="text-sm text-muted-foreground">Revenue Collected</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">${(stats.pendingRevenue / 1000).toFixed(0)}K</div>
                <div className="text-sm text-muted-foreground">Pending Revenue</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterPackage} onValueChange={setFilterPackage}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Package" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Packages</SelectItem>
                <SelectItem value="Starter">Starter</SelectItem>
                <SelectItem value="Professional">Professional</SelectItem>
                <SelectItem value="Enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="discovery">Discovery</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="build">Build</SelectItem>
                <SelectItem value="launch">Launch</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Client Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">Loading clients...</span>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mb-4 opacity-30" />
              <p className="text-lg font-medium">No clients found</p>
              <p className="text-sm">
                {clients.length === 0
                  ? "Add your first client to get started."
                  : "Try adjusting your search or filters."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {client.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{client.name}</div>
                          <div className="text-sm text-muted-foreground">{client.company}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getPackageBadge(client.package)}</TableCell>
                    <TableCell>{getStatusBadge(client.status)}</TableCell>
                    <TableCell>
                      <div className="w-24">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>{client.progress}%</span>
                        </div>
                        <Progress value={client.progress} className="h-2" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">${client.totalValue.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">
                          Paid: ${client.paidAmount.toLocaleString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{client.successManager}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {client.lastActivity}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              toast.info(`Viewing details for ${client.name}`)
                            }
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              toast.info(
                                `Edit dialog for "${client.name}" coming soon.`
                              )
                            }
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Client
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              toast.success(`Email drafted for ${client.email}`)
                            }
                          >
                            <Mail className="mr-2 h-4 w-4" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              toast.success(
                                `Call scheduled with ${client.name}`
                              )
                            }
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            Schedule Call
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() =>
                              handleDeleteClient(client.id, client.name)
                            }
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminClients;
