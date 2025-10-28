import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import type { NumerologyPreset } from "@/hooks/use-agent-profiles";

interface NumerologyPresetCardProps {
  preset: NumerologyPreset;
}

export const NumerologyPresetCard = ({ preset }: NumerologyPresetCardProps) => {
  const isMasterNumber = [11, 22, 33, 44].includes(preset.number);

  return (
    <Card className="p-6 hover:border-primary/40 transition-smooth">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xl font-bold text-primary">{preset.number}</span>
          </div>
          <div>
            <h3 className="font-semibold text-lg">{preset.name}</h3>
            {isMasterNumber && (
              <Badge variant="secondary" className="gap-1 mt-1">
                <Sparkles className="w-3 h-3" />
                Master Number
              </Badge>
            )}
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-4">{preset.description}</p>

      {preset.traits && (
        <div className="space-y-3 text-sm">
          <div>
            <span className="text-muted-foreground font-medium">Energy:</span>
            <span className="ml-2 text-foreground">{preset.traits.energy}</span>
          </div>
          <div>
            <span className="text-muted-foreground font-medium">Focus:</span>
            <span className="ml-2 text-foreground">{preset.traits.focus}</span>
          </div>
          <div>
            <span className="text-muted-foreground font-medium">Strengths:</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {preset.traits.strengths.map((strength, i) => (
                <Badge key={i} variant="outline">{strength}</Badge>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
