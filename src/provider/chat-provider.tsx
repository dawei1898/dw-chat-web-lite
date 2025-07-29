'use client'

import React, {createContext, useEffect, useState} from 'react';



interface ChatContextType {
    open: boolean;
    setOpen: (val: boolean) => void;
    activeKey: string;
    setActiveKey: (val: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
    const context = React.useContext(ChatContext);
    if (context === undefined) {
        throw new Error("useChat 必须在 ChatProvider 内使用！");
    }
    return context;
}

/**
 * 对话管理 Provider
 */
const ChatProvider = (
    {children}: { children: React.ReactNode }
) => {

    const [collapsed, setCollapsed] = useState(false);
    const [activeValue, setActiveValue] = useState<string>('')

    const value = {
        open: collapsed,
        setOpen: setCollapsed,
        activeKey: activeValue,
        setActiveKey: setActiveValue,
    }

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};

export default ChatProvider;