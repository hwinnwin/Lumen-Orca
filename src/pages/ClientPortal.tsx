import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Rocket,
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
} from "lucide-react";
import { toast } from "sonner";

const ClientPortal = () => {
  const [newMessage, setNewMessage] = useState("");

  // Mock client data
  const clientData = {
    name: "John Smith",
    package: "Professional",
    startDate: "January 15, 2025",
    launchDate: "February 15, 2025",
    progress: 65,
    currentPhase: "Build",
    successManager: {
      name: "Sarah Chen",
      avatar: "SC",
      email: "sarah@launchpad.com",
    },
  };

  const phases = [
    { name: "Discovery", status: "completed", progress: 100 },
    { name: "Design", status: "completed", progress: 100 },
    { name: "Build", status: "in_progress", progress: 60 },
    { name: "Launch", status: "pending", progress: 0 },
  ];

  const tasks = [
    { id: 1, title: "Brand guidelines review", status: "completed", dueDate: "Jan 18" },
    { id: 2, title: "Homepage design approval", status: "completed", dueDate: "Jan 22" },
    { id: 3, title: "AI agent configuration", status: "in_progress", dueDate: "Jan 28" },
    { id: 4, title: "Email sequence review", status: "in_progress", dueDate: "Jan 30" },
    { id: 5, title: "Payment integration setup", status: "pending", dueDate: "Feb 3" },
    { id: 6, title: "User testing feedback", status: "pending", dueDate: "Feb 8" },
    { id: 7, title: "Launch preparation", status: "pending", dueDate: "Feb 12" },
  ];

  const messages = [
    {
      id: 1,
      sender: "Sarah Chen",
      avatar: "SC",
      message: "Great news! The homepage design is approved. Moving to development now.",
      time: "2 hours ago",
      isTeam: true,
    },
    {
      id: 2,
      sender: "You",
      message: "Perfect! I love how the AI chatbot section turned out.",
      time: "1 hour ago",
      isTeam: false,
    },
    {
      id: 3,
      sender: "Sarah Chen",
      avatar: "SC",
      message: "Thank you! For your next action item, please review the email sequences I sent over. Let me know if you want any changes.",
      time: "45 min ago",
      isTeam: true,
    },
  ];

  const documents = [
    { name: "Brand Guidelines v2.pdf", date: "Jan 18", size: "2.4 MB" },
    { name: "Homepage Mockup.fig", date: "Jan 22", size: "8.1 MB" },
    { name: "AI Agent Specs.pdf", date: "Jan 25", size: "1.2 MB" },
    { name: "Email Sequences.docx", date: "Jan 26", size: "340 KB" },
  ];

  const upcomingCalls = [
    { title: "Weekly Check-in", date: "Jan 28, 2025", time: "2:00 PM" },
    { title: "AI Demo Review", date: "Feb 1, 2025", time: "3:00 PM" },
  ];

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    toast.success("Message sent!");
    setNewMessage("");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/home" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Rocket className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">LaunchPad</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarFallback>JS</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome back, {clientData.name.split(" ")[0]}</h1>
            <p className="text-muted-foreground">
              Your {clientData.package} package is {clientData.progress}% complete
            </p>
          </div>

          {/* Progress Overview */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Overall Progress</span>
                    <span className="text-2xl font-bold text-primary">{clientData.progress}%</span>
                  </div>
                  <Progress value={clientData.progress} className="h-3 mb-4" />
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
                      {clientData.currentPhase}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Expected Launch</div>
                    <div className="font-semibold flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      {clientData.launchDate}
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
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex gap-3 ${!msg.isTeam ? "flex-row-reverse" : ""}`}
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{msg.isTeam ? msg.avatar : "Y"}</AvatarFallback>
                            </Avatar>
                            <div
                              className={`max-w-[70%] ${
                                !msg.isTeam ? "text-right" : ""
                              }`}
                            >
                              <div
                                className={`p-3 rounded-lg ${
                                  msg.isTeam
                                    ? "bg-muted"
                                    : "bg-primary text-primary-foreground"
                                }`}
                              >
                                {msg.message}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {msg.sender} • {msg.time}
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
                          className="min-h-[60px]"
                        />
                        <Button onClick={handleSendMessage} size="icon" className="h-[60px] w-[60px]">
                          <Send className="h-5 w-5" />
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
                        {documents.map((doc, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-primary" />
                              <div>
                                <div className="font-medium">{doc.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {doc.date} • {doc.size}
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
                      <AvatarFallback>{clientData.successManager.avatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">{clientData.successManager.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {clientData.successManager.email}
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
                    <Badge className="mb-2">{clientData.package} Package</Badge>
                    <div className="text-sm text-muted-foreground mb-4">
                      Started {clientData.startDate}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Support valid until July 15, 2025
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
