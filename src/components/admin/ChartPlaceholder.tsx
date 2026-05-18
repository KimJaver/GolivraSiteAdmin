import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart } from "lucide-react";

interface ChartPlaceholderProps {
  title: string;
  description?: string;
}

export function ChartPlaceholder({ title, description }: ChartPlaceholderProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent>
        <div className="relative h-64 w-full">
          {/* Y axis */}
          <div className="absolute inset-0 flex flex-col justify-between text-[10px] text-muted-foreground">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-6 text-right">—</span>
                <div className="h-px flex-1 bg-border/60" />
              </div>
            ))}
          </div>
          {/* Empty overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <LineChart className="h-8 w-8 text-muted-foreground/40" />
            <p className="mt-2 text-xs text-muted-foreground">Aucune donnée à afficher</p>
          </div>
          {/* X axis labels */}
          <div className="absolute -bottom-5 left-8 right-0 flex justify-between text-[10px] text-muted-foreground">
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i}>—</span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
