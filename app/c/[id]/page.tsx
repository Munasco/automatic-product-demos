import { ChatPage } from "@/components/chat-page";
import { Id } from "@/convex/_generated/dataModel";

export default async function ChatRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ChatPage chatId={id as Id<"chats">} />;
}
