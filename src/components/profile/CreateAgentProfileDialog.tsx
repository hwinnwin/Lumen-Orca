import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Plus, Sparkles } from "lucide-react";
import { useAgentProfiles } from "@/hooks/use-agent-profiles";

export const CreateAgentProfileDialog = () => {
  const [open, setOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const { numerologyPresets, createProfile } = useAgentProfiles();
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    description: "",
    system_prompt: "",
    avatar_url: "",
    is_active: false
  });

  const handlePresetSelect = (presetNumber: number) => {
    const preset = numerologyPresets.find(p => p.number === presetNumber);
    if (preset) {
      setSelectedPreset(presetNumber);
      setFormData(prev => ({
        ...prev,
        role: preset.name,
        description: preset.description,
        system_prompt: preset.system_prompt_template
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProfile({
        ...formData,
        numerology_number: selectedPreset
      });
      setOpen(false);
      setFormData({
        name: "",
        role: "",
        description: "",
        system_prompt: "",
        avatar_url: "",
        is_active: false
      });
      setSelectedPreset(null);
    } catch (error) {
      // Error handled in hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Create Agent Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Create Agent Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Numerology Presets */}
          <div className="space-y-3">
            <Label>Choose Numerology Preset (Optional)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto p-2">
              {numerologyPresets.map((preset) => (
                <Card
                  key={preset.number}
                  className={`p-3 cursor-pointer transition-smooth hover:border-primary ${
                    selectedPreset === preset.number ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => handlePresetSelect(preset.number)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className="gap-1">
                      <Sparkles className="w-3 h-3" />
                      {preset.number}
                    </Badge>
                    {[11, 22, 33, 44].includes(preset.number) && (
                      <Badge variant="secondary" className="text-xs">Master</Badge>
                    )}
                  </div>
                  <h4 className="font-semibold text-sm mb-1">{preset.name}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {preset.description}
                  </p>
                  {preset.traits && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <div className="font-medium">{preset.traits.energy}</div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Profile Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Creative Strategist"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Input
                  id="role"
                  placeholder="e.g., The Creative"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What is this agent profile optimized for?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="system_prompt">System Prompt *</Label>
              <Textarea
                id="system_prompt"
                placeholder="You are an AI agent that..."
                value={formData.system_prompt}
                onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar_url">Avatar URL</Label>
              <Input
                id="avatar_url"
                placeholder="https://..."
                value={formData.avatar_url}
                onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Profile</Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
