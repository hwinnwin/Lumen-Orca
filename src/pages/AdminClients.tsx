import { useState } from "react";
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
} from "lucide-react";
import { toast } from "sonner";

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
}

const AdminClients = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPackage, setFilterPackage] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);

  // Mock client data
  const clients: Client[] = [
    {
      id: "1",
      name: "John Smith",
      email: "john@example.com",
      phone: "+1 555-0101",
      company: "Smith Consulting",
      package: "Professional",
      status: "build",
      progress: 65,
      startDate: "2025-01-15",
      launchDate: "2025-02-15",
      totalValue: 50000,
      paidAmount: 35000,
      successManager: "Sarah Chen",
      lastActivity: "2 hours ago",
    },
    {
      id: "2",
      name: "Emily Johnson",
      email: "emily@example.com",
      phone: "+1 555-0102",
      company: "EJ Coaching",
      package: "Starter",
      status: "discovery",
      progress: 15,
      startDate: "2025-01-20",
      launchDate: "2025-02-20",
      totalValue: 25000,
      paidAmount: 10000,
      successManager: "Mike Ross",
      lastActivity: "1 day ago",
    },
    {
      id: "3",
      name: "Marcus Williams",
      email: "marcus@example.com",
      phone: "+1 555-0103",
      company: "Williams Agency",
      package: "Enterprise",
      status: "completed",
      progress: 100,
      startDate: "2024-11-01",
      launchDate: "2024-12-01",
      totalValue: 100000,
      paidAmount: 100000,
      successManager: "Sarah Chen",
      lastActivity: "1 week ago",
    },
    {
      id: "4",
      name: "Sarah Martinez",
      email: "sarah@example.com",
      phone: "+1 555-0104",
      company: "Martinez Digital",
      package: "Professional",
      status: "design",
      progress: 35,
      startDate: "2025-01-10",
      launchDate: "2025-02-10",
      totalValue: 50000,
      paidAmount: 20000,
      successManager: "Mike Ross",
      lastActivity: "5 hours ago",
    },
    {
      id: "5",
      name: "David Lee",
      email: "david@example.com",
      phone: "+1 555-0105",
      company: "Lee Ventures",
      package: "Enterprise",
      status: "launch",
      progress: 90,
      startDate: "2024-12-15",
      launchDate: "2025-01-25",
      totalValue: 100000,
      paidAmount: 70000,
      successManager: "Sarah Chen",
      lastActivity: "3 hours ago",
    },
  ];

  const stats = {
    totalClients: clients.length,
    activeProjects: clients.filter((c) => c.status !== "completed" && c.status !== "paused").length,
    totalRevenue: clients.reduce((sum, c) => sum + c.paidAmount, 0),
    pendingRevenue: clients.reduce((sum, c) => sum + (c.totalValue - c.paidAmount), 0),
  };

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

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPackage = filterPackage === "all" || client.package === filterPackage;
    const matchesStatus = filterStatus === "all" || client.status === filterStatus;
    return matchesSearch && matchesPackage && matchesStatus;
  });

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
                  <Input placeholder="John Smith" />
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input placeholder="Smith Consulting" />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" placeholder="john@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input type="tel" placeholder="+1 555-0100" />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Package</Label>
                  <Select>
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
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Assign manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sarah">Sarah Chen</SelectItem>
                      <SelectItem value="mike">Mike Ross</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Target Launch Date</Label>
                  <Input type="date" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea placeholder="Any additional notes about this client..." />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddClientOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast.success("Client added successfully!");
                setIsAddClientOpen(false);
              }}>
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
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Client Table */}
      <Card>
        <CardContent className="pt-6">
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
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Client
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Calendar className="mr-2 h-4 w-4" />
                          Schedule Call
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
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
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminClients;
