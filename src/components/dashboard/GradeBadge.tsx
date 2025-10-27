import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LetterGrade, GRADE_COLORS } from "@/lib/grading";

interface GradeBadgeProps {
  grade: LetterGrade;
  metric?: string;
  showDescription?: boolean;
}

export const GradeBadge = ({ grade, metric, showDescription = true }: GradeBadgeProps) => {
  const gradeInfo = GRADE_COLORS[grade];
  
  const content = (
    <Badge 
      variant="outline" 
      className="font-mono"
      style={{ borderColor: gradeInfo.color, color: gradeInfo.color }}
    >
      {grade}
    </Badge>
  );
  
  if (!showDescription) return content;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-semibold">{gradeInfo.description}</p>
          {metric && <p className="text-xs text-muted-foreground">{metric}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
