import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles,
  CheckCircle2,
  Clock,
  Calendar,
  MessageSquare,
  FileText,
  Settings,
  Video,
  Download,
  Send,
  Bell,
  ExternalLink,
  AlertCircle,
  Zap,
  Users,
  BarChart3,
  Bot,
  Globe,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// ---------- Local type definitions (tables not yet in generated types) ----------

interface ClientRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  package: string | null;
  status: string | null;
  progress: number | null;
  start_date: string | null;
  launch_date: string | null;
  total_value: number | null;
  paid_amount: number | null;
  success_manager: string | null;
  notes: string | null;
}

interface ClientMessageRow {
  id: string;
  client_id: string;
  sender_name: string;
  message: string;
  is_team: boolean;
  user_id: string | null;
  created_at: string;
}

interface ClientDocumentRow {
  id: string;
  client_id: string;
  name: string;
  file_path: string | null;
  file_size: string | null;
  uploaded_at: string;
}

// ---------- Helpers ----------

/** Turn an ISO / date string into a human-readable label like "January 15, 2025" */
function formatDate(raw: string | null): string {
  if (!raw) return "TBD";
  const d = new Date(raw);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/** Turn an ISO timestamp into a relative description (e.g. "2 hours ago") */
function timeAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

/** Initials from a full name */
function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Derive the four project phases from a client's status + progress values */
function derivePhases(status: string | null, progress: number) {
  const phaseOrder = ["discovery", "design", "build", "launch"];
  const phaseLabels: Record<string, string> = {
    discovery: "Discovery",
    design: "Design",
    build: "Build",
    launch: "Launch",
  };

  const currentIndex = phaseOrder.indexOf((status ?? "discovery").toLowerCase());
  const effectiveIndex = currentIndex === -1 ? 0 : currentIndex;

  return phaseOrder.map((key, i) => {
    let phaseStatus: "completed" | "in_progress" | "pending";
    let phaseProgress: number;

    if (i < effectiveIndex) {
      phaseStatus = "completed";
      phaseProgress = 100;
    } else if (i === effectiveIndex) {
      phaseStatus = progress >= 100 ? "completed" : "in_progress";
      phaseProgress = progress;
    } else {
      phaseStatus = "pending";
      phaseProgress = 0;
    }

    return { name: phaseLabels[key], status: phaseStatus, progress: phaseProgress };
  });
}

// ---------- Component ----------

const ClientPortal = () => {
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Data state
  const [client, setClient] = useState<ClientRow | null>(null);
  const [messages, setMessages] = useState<ClientMessageRow[]>([]);
  const [documents, setDocuments] = useState<ClientDocumentRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Loading / error state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---- data fetching ----

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Get the currently logged-in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("You must be logged in to view the client portal.");
        setLoading(false);
        return;
      }

      setUserId(user.id);

      // 2. Find the client record matching the user's email
      const { data: clientData, error: clientError } = await (supabase
        .from("clients" as any)
        .select("*")
        .eq("email", user.email!)
        .single() as any);

      if (clientError || !clientData) {
        // No client record -- not necessarily a hard error
        setClient(null);
        setLoading(false);
        return;
      }

      const clientRecord = clientData as unknown as ClientRow;
      setClient(clientRecord);

      // 3. Load messages and documents in parallel
      const [messagesRes, documentsRes] = await Promise.all([
        (supabase
          .from("client_messages" as any)
          .select("*")
          .eq("client_id", clientRecord.id)
          .order("created_at", { ascending: true }) as any),
        (supabase
          .from("client_documents" as any)
          .select("*")
          .eq("client_id", clientRecord.id)
          .order("uploaded_at", { ascending: false }) as any),
      ]);

      if (messagesRes.data) {
        setMessages(messagesRes.data as unknown as ClientMessageRow[]);
      }
      if (documentsRes.data) {
        setDocuments(documentsRes.data as unknown as ClientDocumentRow[]);
      }
    } catch (err: any) {
      console.error("ClientPortal loadData error:", err);
      setError("Something went wrong loading your portal. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ---- send message ----

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !client || !userId) return;

    setSending(true);
    try {
      const { error: insertError } = await (supabase.from("client_messages" as any).insert({
        client_id: client.id,
        sender_name: client.name,
        message: newMessage.trim(),
        is_team: false,
        user_id: userId,
      } as any) as any);

      if (insertError) {
        toast.error("Failed to send message. Please try again.");
        console.error("Insert message error:", insertError);
        return;
      }

      toast.success("Message sent!");
      setNewMessage("");

      // Re-fetch messages to get the server-generated created_at
      const { data: freshMessages } = await (supabase
        .from("client_messages" as any)
        .select("*")
        .eq("client_id", client.id)
        .order("created_at", { ascending: true }) as any);

      if (freshMessages) {
        setMessages(freshMessages as unknown as ClientMessageRow[]);
      }
    } catch (err) {
      console.error("Send message error:", err);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  // ---- derived values ----

  const progress = client?.progress ?? 0;
  const phases = client ? derivePhases(client.status, progress) : [];
  const currentPhaseName =
    phases.find((p) => p.status === "in_progress")?.name ??
    phases.find((p) => p.status === "pending")?.name ??
    "Complete";

  // Tasks remain local (task management is a separate feature)
  const tasks = [
    { id: 1, title: "Brand guidelines review", status: "completed", dueDate: "Jan 18" },
    { id: 2, title: "Homepage design approval", status: "completed", dueDate: "Jan 22" },
    { id: 3, title: "AI agent configuration", status: "in_progress", dueDate: "Jan 28" },
    { id: 4, title: "Email sequence review", status: "in_progress", dueDate: "Jan 30" },
    { id: 5, title: "Payment integration setup", status: "pending", dueDate: "Feb 3" },
    { id: 6, title: "User testing feedback", status: "pending", dueDate: "Feb 8" },
    { id: 7, title: "Launch preparation", status: "pending", dueDate: "Feb 12" },
  ];

  const upcomingCalls = [
    { title: "Weekly Check-in", date: "Jan 28, 2025", time: "2:00 PM" },
    { title: "AI Demo Review", date: "Feb 1, 2025", time: "3:00 PM" },
  ];

  // ---- loading state ----

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your portal...</p>
        </div>
      </div>
    );
  }

  // ---- error state ----

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadData}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---- no client record ----

  if (!client) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <Link to="/home" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">Lumen Orca</span>
            </Link>
          </div>
        </nav>
        <div className="pt-24 flex items-center justify-center px-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Active Project Found</h2>
              <p className="text-muted-foreground mb-4">
                We couldn't find an active project associated with your account. If you believe
                this is a mistake, please contact our support team.
              </p>
              <Link to="/home">
                <Button>Back to Home</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ---- main portal ----

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/home" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">Lumen Orca</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarFallback>{initials(client.name)}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {client.name.split(" ")[0]}
            </h1>
            <p className="text-muted-foreground">
              Your {client.package ?? "Standard"} package is {progress}% complete
            </p>
          </div>

          {/* Progress Overview */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Overall Progress</span>
                    <span className="text-2xl font-bold text-primary">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-3 mb-4" />
                  <div className="grid grid-cols-4 gap-2">
                    {phases.map((phase, i) => (
                      <div key={i} className="text-center">
                        <div
                          className={`h-2 rounded-full mb-2 ${
                            phase.status === "completed"
                              ? "bg-green-500"
                              : phase.status === "in_progress"
                              ? "bg-primary"
                              : "bg-muted"
                          }`}
                        />
                        <span className="text-xs text-muted-foreground">{phase.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="md:border-l md:pl-6 space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Current Phase</div>
                    <div className="font-semibold flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      {currentPhaseName}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Expected Launch</div>
                    <div className="font-semibold flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      {formatDate(client.launch_date)}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Tasks & Updates */}
            <div className="lg:col-span-2 space-y-8">
              <Tabs defaultValue="tasks">
                <TabsList>
                  <TabsTrigger value="tasks">Tasks</TabsTrigger>
                  <TabsTrigger value="messages">Messages</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="tasks" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Project Tasks</CardTitle>
                      <CardDescription>Track deliverables and action items</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {tasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center justify-between p-3 rounded-lg border"
                          >
                            <div className="flex items-center gap-3">
                              {task.status === "completed" ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              ) : task.status === "in_progress" ? (
                                <Clock className="h-5 w-5 text-primary animate-pulse" />
                              ) : (
                                <div className="h-5 w-5 rounded-full border-2 border-muted" />
                              )}
                              <span
                                className={
                                  task.status === "completed" ? "line-through text-muted-foreground" : ""
                                }
                              >
                                {task.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge
                                variant={
                                  task.status === "completed"
                                    ? "secondary"
                                    : task.status === "in_progress"
                                    ? "default"
                                    : "outline"
                                }
                              >
                                {task.status === "completed"
                                  ? "Done"
                                  : task.status === "in_progress"
                                  ? "In Progress"
                                  : "Pending"}
                              </Badge>
                              <span className="text-sm text-muted-foreground">{task.dueDate}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="messages" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Messages</CardTitle>
                      <CardDescription>Communication with your team</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
                        {messages.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            No messages yet. Start a conversation with your team!
                          </p>
                        )}
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex gap-3 ${!msg.is_team ? "flex-row-reverse" : ""}`}
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {msg.is_team ? initials(msg.sender_name) : "Y"}
                              </AvatarFallback>
                            </Avatar>
                            <div
                              className={`max-w-[70%] ${
                                !msg.is_team ? "text-right" : ""
                              }`}
                            >
                              <div
                                className={`p-3 rounded-lg ${
                                  msg.is_team
                                    ? "bg-muted"
                                    : "bg-primary text-primary-foreground"
                                }`}
                              >
                                {msg.message}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {msg.is_team ? msg.sender_name : "You"} • {timeAgo(msg.created_at)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Textarea
                          placeholder="Type your message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          className="min-h-[60px]"
                        />
                        <Button
                          onClick={handleSendMessage}
                          disabled={sending || !newMessage.trim()}
                          size="icon"
                          className="h-[60px] w-[60px]"
                        >
                          {sending ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Send className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="documents" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Documents</CardTitle>
                      <CardDescription>Project files and deliverables</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {documents.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            No documents have been shared yet.
                          </p>
                        )}
                        {documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-primary" />
                              <div>
                                <div className="font-medium">{doc.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {formatDate(doc.uploaded_at)}
                                  {doc.file_size ? ` • ${doc.file_size}` : ""}
                                </div>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* What's Being Built */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">What's Being Built</CardTitle>
                  <CardDescription>Your platform components and features</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      {
                        icon: Globe,
                        title: "Custom Website",
                        status: "In Development",
                        progress: 70,
                      },
                      {
                        icon: Bot,
                        title: "AI Agents (5)",
                        status: "Configuration",
                        progress: 40,
                      },
                      {
                        icon: Users,
                        title: "User Management",
                        status: "Complete",
                        progress: 100,
                      },
                      {
                        icon: BarChart3,
                        title: "Analytics Dashboard",
                        status: "In Development",
                        progress: 55,
                      },
                    ].map((item, i) => (
                      <div key={i} className="p-4 rounded-lg border">
                        <div className="flex items-center gap-3 mb-3">
                          <item.icon className="h-5 w-5 text-primary" />
                          <div>
                            <div className="font-medium">{item.title}</div>
                            <div className="text-xs text-muted-foreground">{item.status}</div>
                          </div>
                        </div>
                        <Progress value={item.progress} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Success Manager */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Success Manager</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>
                        {client.success_manager ? initials(client.success_manager) : "SM"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">
                        {client.success_manager ?? "Unassigned"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Success Manager
                      </div>
                    </div>
                  </div>
                  <Button className="w-full" variant="outline">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Send Message
                  </Button>
                </CardContent>
              </Card>

              {/* Upcoming Calls */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Upcoming Calls</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {upcomingCalls.map((call, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Video className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{call.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {call.date} at {call.time}
                          </div>
                        </div>
                        <Button size="sm" variant="ghost">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full mt-4" variant="outline">
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule New Call
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full justify-start" variant="outline">
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Report an Issue
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    View Contract
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Settings className="mr-2 h-4 w-4" />
                    Account Settings
                  </Button>
                </CardContent>
              </Card>

              {/* Package Info */}
              <Card className="bg-primary/5">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Badge className="mb-2">{client.package ?? "Standard"} Package</Badge>
                    <div className="text-sm text-muted-foreground mb-4">
                      Started {formatDate(client.start_date)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {client.total_value != null && client.paid_amount != null
                        ? `$${client.paid_amount.toLocaleString()} of $${client.total_value.toLocaleString()} paid`
                        : "Contact us for billing details"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientPortal;
