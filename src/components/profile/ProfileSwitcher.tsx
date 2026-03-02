import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Bot, Sparkles } from "lucide-react";
import { useAgentProfiles } from "@/hooks/use-agent-profiles";
import { useAuth } from "@/hooks/use-auth";

export const ProfileSwitcher = () => {
  const { user } = useAuth();
  const { profiles, activeProfile, switchToProfile, switchToUserMode } = useAgentProfiles();

  if (!user) return null;

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Active Mode</h3>
          {activeProfile?.numerology_number && (
            <Badge variant="outline" className="gap-1">
              <Sparkles className="w-3 h-3" />
              {activeProfile.numerology_number}
            </Badge>
          )}
        </div>

        {/* User Mode */}
        <Button
          variant={!activeProfile ? "default" : "outline"}
          className="w-full justify-start gap-3"
          onClick={switchToUserMode}
        >
          <Avatar className="w-8 h-8">
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback>
              <User className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium">User Mode</div>
            <div className="text-xs text-muted-foreground">
              {user.email}
            </div>
          </div>
        </Button>

        {/* Agent Profiles */}
        {profiles.map((profile) => (
          <Button
            key={profile.id}
            variant={profile.is_active ? "default" : "outline"}
            className="w-full justify-start gap-3"
            onClick={() => switchToProfile(profile.id)}
          >
            <Avatar className="w-8 h-8">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="bg-accent">
                <Bot className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium">{profile.name}</div>
              <div className="text-xs text-muted-foreground truncate">
                {profile.role}
              </div>
            </div>
          </Button>
        ))}
      </div>
    </Card>
  );
};
