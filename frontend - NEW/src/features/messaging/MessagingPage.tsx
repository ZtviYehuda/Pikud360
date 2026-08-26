import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ConversationList } from "./components/ConversationList";
import { ChatArea } from "./components/ChatArea";
import { CreateGroupModal } from "./components/CreateGroupModal";
import { MessageSearchModal } from "./components/MessageSearchModal";
import { useMessaging } from "./hooks/useMessaging";
import { cn } from "@/lib/utils";

export const MessagingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialConvId = searchParams.get("conv");

  const [selectedConvId, setSelectedConvId] = useState<string | null>(initialConvId);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const {
    conversations,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    reloadConversations,
    createGroup,
    isLoading,
  } = useMessaging(selectedConvId);

  useEffect(() => {
    if (initialConvId) {
      setSelectedConvId(initialConvId);
    }
  }, [initialConvId]);

  const handleSelectConversation = (id: string) => {
    setSelectedConvId(id);
    setSearchParams({ conv: id });
  };

  const handleBackToMobileList = () => {
    setSelectedConvId(null);
    setSearchParams({});
  };

  return (
    <div className="h-[calc(100dvh-4rem)] flex flex-col font-sans overflow-hidden bg-background" dir="rtl">
      <div className="flex-1 flex overflow-hidden border-t border-border/40">
        {/* Right / List Panel (in RTL it's on the right) */}
        <div
          className={cn(
            "w-full md:w-80 lg:w-[360px] flex flex-col shrink-0 transition-all border-l border-border/40 bg-background",
            selectedConvId ? "hidden md:flex" : "flex"
          )}
        >
          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedConvId}
            onSelectConversation={handleSelectConversation}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
            onOpenSearchModal={() => setIsSearchModalOpen(true)}
            isLoading={isLoading}
          />
        </div>

        {/* Left / Main Chat Panel */}
        <div
          className={cn(
            "flex-1 flex flex-col h-full overflow-hidden bg-slate-50/50 dark:bg-slate-950/40 transition-all",
            !selectedConvId ? "hidden md:flex" : "flex"
          )}
        >
          <ChatArea
            conversationId={selectedConvId}
            onConversationUpdated={reloadConversations}
            onBack={handleBackToMobileList}
            onSelectConversation={handleSelectConversation}
          />
        </div>
      </div>

      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onCreateGroup={createGroup}
      />

      <MessageSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectConversation={handleSelectConversation}
      />
    </div>
  );
};

export default MessagingPage;
