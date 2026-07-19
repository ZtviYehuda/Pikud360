import { useState, useEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import { useTranslation } from "react-i18next";
import { schedulingService } from "../services/schedulingService";
import Unauthorized from "./Unauthorized";
import { OrganizationUnit } from "../types";
import { CommanderWorkspaceProvider } from "../features/commander/context/CommanderWorkspaceContext";
import { DashboardPage } from "../features/dashboard/pages/DashboardPage";

export default function CommanderDashboard() {
  const { hasPermission } = useAuthStore();
  const { t } = useTranslation();

  if (!hasPermission("dashboard.view")) {
    return <Unauthorized />;
  }

  const [orgTree, setOrgTree] = useState<OrganizationUnit[]>([]);

  useEffect(() => {
    let active = true;
    schedulingService
      .getOrganizationTree()
      .then((data) => {
        if (active) setOrgTree(data);
      })
      .catch(() => {
        if (active) {
          setOrgTree([
            {
              id: "unit-uuid-555",
              name: t("common:app_name"),
              code: "BRIG_HQ",
              children: [
                {
                  id: "unit-uuid-666",
                  name: t("common:organization"),
                  code: "CO_A",
                  children: [],
                },
                {
                  id: "unit-uuid-777",
                  name: t("common:organization"),
                  code: "CO_B",
                  children: [],
                },
              ],
            },
          ]);
        }
      });
    return () => {
      active = false;
    };
  }, [t]);

  return (
    <CommanderWorkspaceProvider orgTree={orgTree}>
      <DashboardPage />
    </CommanderWorkspaceProvider>
  );
}
export { CommanderDashboard };
