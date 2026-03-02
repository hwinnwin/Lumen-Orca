import { Card } from "@/components/ui/card";
import { FileJson } from "lucide-react";

const Contracts = () => {
  return (
    <div className="min-h-screen p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">Contracts</h1>
        <p className="text-muted-foreground">
          JSON Schema definitions and TypeScript type contracts
        </p>
      </div>

      <Card className="p-8 border border-border">
        <div className="flex flex-col items-center justify-center py-12">
          <FileJson className="w-16 h-16 text-primary/40 mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">@lumen/contracts</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Contract schemas ensure type safety across agent boundaries.
            All inter-agent communication validates against these definitions.
          </p>
          <div className="mt-8 p-4 bg-muted/20 rounded-lg border border-border font-mono text-xs">
            <pre className="text-muted-foreground">
{`{
  "taskSpec": {
    "type": "object",
    "required": ["id", "agent", "deps"],
    "properties": {
      "id": { "type": "string" },
      "agent": { "enum": ["A0", "A1", ...] },
      "deps": { "type": "array" }
    }
  }
}`}
            </pre>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Contracts;
