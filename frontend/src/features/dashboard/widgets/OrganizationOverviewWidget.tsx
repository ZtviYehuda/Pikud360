import * as React from "react";
import { GitBranch, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardContent } from "../../../components/ui/card";
import { OrganizationTreeDTO, OrganizationTreeNodeDTO } from "../types";

interface OrganizationOverviewWidgetProps {
  data?: OrganizationTreeDTO;
  loading: boolean;
  error: boolean;
}

// ==========================================
// Subunit Tree Node Component
// ==========================================
const OrgTreeNode: React.FC<{ node: OrganizationTreeNodeDTO; depth?: number }> = ({ node, depth = 0 }) => {
  const [isOpen, setIsOpen] = React.useState(depth < 2); // Auto-expand root and first children

  const hasChildren = node.children && node.children.length > 0;
  const statusColors = {
    OPTIMAL: "bg-emerald-500",
    WARNING: "bg-amber-500",
    CRITICAL: "bg-red-500",
  };

  return (
    <div className="flex flex-col text-right">
      <div
        className="flex items-center justify-between p-2 rounded-enterprise-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors select-none cursor-pointer"
        style={{ paddingRight: `${depth * 16 + 8}px` }}
        onClick={() => hasChildren && setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          {hasChildren && (
            <span className="text-slate-400">
              {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </span>
          )}
          <span className="text-xs font-bold text-slate-800 dark:text-slate-205">{node.name}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500">
            {node.readinessScore}%
          </span>
          <span className={`h-2.5 w-2.5 rounded-full ${statusColors[node.status]}`} />
        </div>
      </div>

      {hasChildren && isOpen && (
        <div className="flex flex-col mt-0.5 border-r border-enterprise-border mr-2 pr-1 gap-0.5">
          {node.children?.map((child) => (
            <OrgTreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

// ==========================================
// OrganizationOverviewWidget Component
// ==========================================
export const OrganizationOverviewWidget: React.FC<OrganizationOverviewWidgetProps> = ({
  data,
  loading,
  error,
}) => {
  if (error) {
    return (
      <Card className="h-full border-red-200 dark:border-red-900 bg-red-50/20">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <GitBranch className="h-8 w-8 text-red-500 mb-2" />
          <span className="text-sm font-bold text-red-650 dark:text-red-400">נכשלה טעינת מבנה ארגוני</span>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="h-full animate-pulse">
        <CardContent className="h-44 bg-slate-100 dark:bg-slate-850 rounded-enterprise-md" />
      </Card>
    );
  }

  return (
    <Card className="h-full select-none">
      <CardHeader className="p-4 border-b border-enterprise-border pb-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-450 dark:text-slate-500">עץ יחידות ומצב כוננות</span>
          <GitBranch className="h-4.5 w-4.5 text-slate-500" />
        </div>
      </CardHeader>
      <CardContent className="p-4 overflow-y-auto max-h-[300px]">
        {data?.rootNode ? (
          <OrgTreeNode node={data.rootNode} />
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center text-slate-450">
            <span className="text-xs font-bold">לא הוגדר מבנה ארגוני במרחב עבודה זה.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
OrganizationOverviewWidget.displayName = "OrganizationOverviewWidget";
