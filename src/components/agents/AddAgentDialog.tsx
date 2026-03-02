import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { agentRegistry } from "@/lib/agent-registry";
import { toast } from "sonner";
import type { CustomAgentDefinition } from "../../../packages/agents/src/types";

interface AddAgentDialogProps {
  onAgentAdded: () => void;
}

export const AddAgentDialog = ({ onAgentAdded }: AddAgentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    role: "",
    description: "",
    systemPrompt: "",
    icon: "Bot",
    maxConcurrentTasks: 3
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const agent: CustomAgentDefinition = {
        ...formData,
        id: formData.id.toUpperCase().replace(/\s+/g, '_'),
      };

      agentRegistry.registerAgent(agent);
      toast.success(`Agent ${agent.name} added successfully`);
      setOpen(false);
      setFormData({
        id: "",
        name: "",
        role: "",
        description: "",
        systemPrompt: "",
        icon: "Bot",
        maxConcurrentTasks: 3
      });
      onAgentAdded();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add agent");
    }
  };

  const limits = agentRegistry.getSystemLimits();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Agent
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Custom Agent</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Agents available: {limits.remainingSlots} / {limits.maxAgents}
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="id">Agent ID *</Label>
              <Input
                id="id"
                placeholder="A11_custom"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="Custom Agent"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Input
              id="role"
              placeholder="Data Processor"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="What does this agent do?"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="systemPrompt">System Prompt *</Label>
            <Textarea
              id="systemPrompt"
              placeholder="You are an AI agent that..."
              value={formData.systemPrompt}
              onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="icon">Icon Name</Label>
              <Input
                id="icon"
                placeholder="Bot"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Lucide React icon name</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxTasks">Max Concurrent Tasks</Label>
              <Input
                id="maxTasks"
                type="number"
                min="1"
                max={limits.maxConcurrentPerAgent}
                value={formData.maxConcurrentTasks}
                onChange={(e) => setFormData({ ...formData, maxConcurrentTasks: parseInt(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">Max: {limits.maxConcurrentPerAgent}</p>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Agent</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
