import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { User, Bot, Sparkles, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useAgentProfiles } from "@/hooks/use-agent-profiles";
import { ProfileSwitcher } from "@/components/profile/ProfileSwitcher";
import { CreateAgentProfileDialog } from "@/components/profile/CreateAgentProfileDialog";
import { NumerologyPresetCard } from "@/components/profile/NumerologyPresetCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Profile = () => {
  const { user } = useAuth();
  const { profiles, numerologyPresets, deleteProfile, loading } = useAgentProfiles();
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) {
      setFullName(data.full_name || '');
      setAvatarUrl(data.avatar_url || '');
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          avatar_url: avatarUrl,
        })
        .eq('id', user.id);

      if (error) throw error;
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return <div className="p-8">Please log in to view your profile.</div>;
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">Profile Management</h1>
            <p className="text-muted-foreground">
              Manage your user profile and agent personas
            </p>
          </div>
          <CreateAgentProfileDialog />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Switcher Sidebar */}
          <div className="lg:col-span-1">
            <ProfileSwitcher />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="user" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="user" className="gap-2">
                  <User className="w-4 h-4" />
                  User Profile
                </TabsTrigger>
                <TabsTrigger value="agents" className="gap-2">
                  <Bot className="w-4 h-4" />
                  Agent Profiles ({profiles.length})
                </TabsTrigger>
                <TabsTrigger value="numerology" className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  Numerology
                </TabsTrigger>
              </TabsList>

              {/* User Profile Tab */}
              <TabsContent value="user" className="space-y-6">
                <Card className="p-6">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-20 h-20">
                        <AvatarImage src={avatarUrl || user.user_metadata?.avatar_url} />
                        <AvatarFallback className="text-2xl">
                          <User className="w-8 h-8" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-semibold">{fullName || user.email}</h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Your name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="avatarUrl">Avatar URL</Label>
                        <Input
                          id="avatarUrl"
                          value={avatarUrl}
                          onChange={(e) => setAvatarUrl(e.target.value)}
                          placeholder="https://..."
                        />
                      </div>

                      <Button onClick={handleSaveProfile} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Profile'}
                      </Button>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Agent Profiles Tab */}
              <TabsContent value="agents" className="space-y-4">
                {loading ? (
                  <Card className="p-6">
                    <p className="text-muted-foreground">Loading profiles...</p>
                  </Card>
                ) : profiles.length === 0 ? (
                  <Card className="p-6">
                    <p className="text-muted-foreground">
                      No agent profiles yet. Create one to get started!
                    </p>
                  </Card>
                ) : (
                  profiles.map((profile) => (
                    <Card key={profile.id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={profile.avatar_url || undefined} />
                            <AvatarFallback className="bg-accent">
                              <Bot className="w-6 h-6" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg">{profile.name}</h3>
                              {profile.is_active && (
                                <Badge variant="default">Active</Badge>
                              )}
                              {profile.numerology_number && (
                                <Badge variant="outline" className="gap-1">
                                  <Sparkles className="w-3 h-3" />
                                  {profile.numerology_number}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-secondary mb-2">{profile.role}</p>
                            {profile.description && (
                              <p className="text-sm text-muted-foreground mb-3">
                                {profile.description}
                              </p>
                            )}
                            <div className="text-xs text-muted-foreground font-mono bg-muted/50 p-2 rounded">
                              {profile.system_prompt.substring(0, 150)}...
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteProfile(profile.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* Numerology Tab */}
              <TabsContent value="numerology" className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {numerologyPresets.map((preset) => (
                    <NumerologyPresetCard key={preset.id} preset={preset} />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
