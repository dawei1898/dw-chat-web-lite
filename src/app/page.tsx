import Chat from "@/app/chat/chat";
import ChatProvider from "@/provider/chat-provider";

export default function Home() {
    return (
        <ChatProvider>
            <Chat/>
        </ChatProvider>
    );
}
