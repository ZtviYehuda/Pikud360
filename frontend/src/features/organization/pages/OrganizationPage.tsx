import * as React from "react";
import { PageContainer } from "../../../components/ui/app-shell/PageContainer";
import { OrganizationHeader } from "../components/OrganizationHeader";
import { DepartmentCard } from "../components/DepartmentCard";
import { OrgTreeChart } from "../components/OrgTreeChart";
import { useOrganizationStore } from "../store/useOrganizationStore";

export const OrganizationPage: React.FC = () => {
  const { structure, viewMode, loading, fetchStructure, setViewMode } =
    useOrganizationStore();

  React.useEffect(() => {
    fetchStructure();
  }, [fetchStructure]);

  return (
    <PageContainer mode="fluid">
      <div className="space-y-6">
        <OrganizationHeader
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {loading ? (
          <div className="space-y-4 py-8">
            <div className="h-24 bg-card rounded-2xl animate-pulse" />
            <div className="h-24 bg-card rounded-2xl animate-pulse" />
            <div className="h-24 bg-card rounded-2xl animate-pulse" />
          </div>
        ) : viewMode === "cards" ? (
          <div className="space-y-4">
            {structure.map((dept) => (
              <DepartmentCard key={dept.id} department={dept} />
            ))}
          </div>
        ) : (
          <OrgTreeChart structure={structure} />
        )}
      </div>
    </PageContainer>
  );
};
OrganizationPage.displayName = "OrganizationPage";
