import { AppShell } from "@/components/AppShell";
import { ChatProvider } from "@/lib/chat/ChatProvider";
import { ChatExperience } from "@/components/chat/ChatExperience";

export default function Home() {
  return (
    <ChatProvider>
      <AppShell>
        <ChatExperience />
      </AppShell>
    </ChatProvider>
  );
}
