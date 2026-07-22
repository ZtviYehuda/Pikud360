import codecs

def fix_file():
    filepath = 'src/pages/DashboardPage.tsx'
    with codecs.open(filepath, 'r', 'utf-8') as f:
        content = f.read()

    start_str = '  return (\n    <div\n      className="w-full relative min-h-screen pb-10 bg-background"'
    end_str = '        {/* Content Area */}'

    start_idx = content.find(start_str)
    end_idx = content.find(end_str)

    if start_idx == -1 or end_idx == -1:
        print('Could not find markers', start_idx, end_idx)
        return

    new_content = '''  return (
    <div
      className="w-full relative min-h-screen pb-10 bg-background"
      dir="rtl"
    >
      <div className="relative z-10 space-y-4 sm:space-y-6 pt-6 transition-all">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 w-full pb-2">
          {/* Right Side (Title) - Top in mobile */}
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="hidden lg:flex w-10 h-10 rounded-xl bg-primary/10 items-center justify-center shrink-0">
              <LayoutDashboard className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 whitespace-nowrap">
              {selectedDeptId || selectedSectionId || selectedTeamId ? לוח בקרה -  : "לוח בקרה"}
            </h1>
            {isOldDate && (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-black px-3 py-1 rounded-lg mr-2">
                {hasArchiveAccess ? "נתונים משוחזרים" : "נתוני ארכיון"}
              </Badge>
            )}
          </div>

          {/* Left Side (Actions) - Left side in LTR or RTL, bottom in mobile */}
          <div className="flex flex-wrap items-center gap-2 lg:gap-3 justify-start lg:justify-end flex-col sm:flex-row w-full lg:w-auto bg-card/30 p-2 sm:p-0 rounded-2xl sm:bg-transparent">
            {/* The Date element! */}
            <DateHeader className="w-full sm:w-auto shadow-none" compact={true} />

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative group flex-1 sm:flex-none">
                <DashboardFilters
                  structure={structure}
                  statuses={allStatuses}
                  allStatusTypes={allStatusTypes}
                  selectedDeptId={selectedDeptId}
                  selectedSectionId={selectedSectionId}
                  selectedTeamId={selectedTeamId}
                  selectedStatusId={selectedStatusData?.id?.toString()}
                  serviceTypes={serviceTypes}
                  selectedServiceTypes={selectedServiceTypes}
                  selectedAgeRange={selectedAgeRange}
                  onFilterChange={handleFilterChange}
                  canSelectDept={canSelectDept}
                  canSelectSection={canSelectSection}
                  canSelectTeam={canSelectTeam}
                  hasActiveFiltersExternal={activeFilterInfo.hasActive}
                  activeFilterCountExternal={activeFilterInfo.count}
                  user={user}
                  isMobile={false}
                  className="w-full sm:w-auto [&>button]:w-full sm:[&>button]:w-auto"
                />
                {activeFilterInfo.hasActive && (
                  <button
                    onClick={() => handleFilterChange("reset")}
                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 flex items-center justify-center border-2 border-background transition-all hover:scale-110 active:scale-90 z-20 group-hover:-translate-y-1"
                    title="נקה סינון"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                )}
              </div>

              {!user?.is_temp_commander && (
                <>
                  <ReportHub
                    className="flex-1 sm:flex-none h-10 rounded-xl border border-border/40 bg-card/40 backdrop-blur-xl text-primary hover:bg-primary/5 gap-2 font-black px-4 transition-all text-sm lg:text-xs shadow-none w-full sm:w-auto justify-center"
                    onShareBirthdays={() => birthdaysRef.current?.share()}
                    initialViewMode={viewMode}
                    initialDate={selectedDate}
                    filters={{
                      department_id: selectedDeptId?.toString() || "",
                      section_id: selectedSectionId?.toString() || "",
                      team_id: selectedTeamId?.toString() || "",
                      serviceTypes: selectedServiceTypes,
                      unitName: unitName,
                      statusName: selectedStatusData?.name,
                      status_id: selectedStatusData?.id?.toString(),
                    }}
                  />
                  {(user?.is_commander || user?.is_admin) && (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Button
                        onClick={() => setWhatsappBroadcastOpen(true)}
                        className="flex-1 sm:flex-none h-10 rounded-xl border border-border/40 bg-green-500/10 text-green-600 hover:bg-green-500/20 gap-1.5 font-black px-3 sm:px-4 transition-all text-[11px] sm:text-xs justify-center"
                      >
                        <MessageSquare className="w-4 h-4" />
                        רשימת תפוצה
                      </Button>

                      {!user?.is_temp_commander && (
                        <Button
                          onClick={() => setGlobalEventOpen(true)}
                          className="flex-1 sm:flex-none h-10 rounded-xl border border-border/40 bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 gap-1.5 font-black px-3 sm:px-4 transition-all text-[11px] sm:text-xs justify-center"
                        >
                          <CalendarIcon className="w-4 h-4" />
                          אירוע
                        </Button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {fetchError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 font-bold mb-4">
            {fetchError}
          </div>
        )}

'''

    final_content = content[:start_idx] + new_content + content[end_idx:]

    with codecs.open(filepath, 'w', 'utf-8') as f:
        f.write(final_content)
    print("Successfully replaced content!")

if __name__ == '__main__':
    fix_file()
