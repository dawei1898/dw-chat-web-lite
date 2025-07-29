"use client"

import React, { useState} from 'react';
import dynamic from 'next/dynamic';
import {
    Conversations,
    ConversationsProps,
    XProvider
} from "@ant-design/x";
import {
    Button, GetProp,
    message as apiMessage,
    Tooltip, theme,
    ThemeConfig, Flex, Modal, Input,
} from "antd";
import {
    DeleteOutlined,
    EditOutlined,
    PlusOutlined,
    UserOutlined,
} from "@ant-design/icons";
import '@ant-design/v5-patch-for-react-19'; // 兼容 React19
import {AntdRegistry} from "@ant-design/nextjs-registry";
import Logo from "@/components/logo";
import zhCN from "antd/locale/zh_CN";
import {ProLayoutProps} from '@ant-design/pro-components';
import AvatarDropdown from "@/components/avatar-dropdown";
import Footer from "@/components/footer";
import HeaderActions from "@/components/header-actions";
import type {ProTokenType} from "@ant-design/pro-provider";
import {SiderMenuProps} from "@ant-design/pro-layout/es/components/SiderMenu/SiderMenu";
import type {HeaderViewProps} from "@ant-design/pro-layout/es/components/Header";
import {Conversation} from "@ant-design/x/es/conversations";
import {useChat} from "@/provider/chat-provider";
import ChatMessage from "@/components/chat-message";


// 动态导入
const ProLayout = dynamic(
    () => import('@ant-design/pro-components').then(mod => mod.ProLayout),
    { ssr: false }
);
const {useToken} = theme;

const defaultConversationsItems: GetProp<ConversationsProps, 'items'> = []




const ChatPage = () => {
    const {token} = useToken();
    const {open, setOpen, activeKey, setActiveKey} = useChat();
    const [dark, setDark] = useState(false);
    const [conversationsItems, setConversationsItems] = useState(defaultConversationsItems);


    // 主题配置
    const customTheme: ThemeConfig = {
        algorithm: dark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
            colorPrimary: token.colorPrimary,
        }
    }

    // ProLayout Token
    const proLayoutToken: ProTokenType['layout'] = {
        pageContainer: {
            colorBgPageContainer: dark ? '' : token.colorBgBase,
            paddingBlockPageContainerContent: 10,  // 上下内距离
            paddingInlinePageContainerContent: 5, // 左右内距离
        },
    }

    // 处理 logo 和标题文字的样式
    const menuHeaderRender = (logo: React.ReactNode, title: React.ReactNode, props?: SiderMenuProps) => {
        return (
            <Flex align='center'>
                {logo}
                {<span
                    className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                    {title}
                </span>}
            </Flex>
        )
    }

    // 开启新对话按钮
    const addConversationRender = (props: SiderMenuProps) => {
        return <>
            {props.collapsed ?
                <Tooltip title='开启新对话' placement='right'>
                    <Button
                        style={{
                            backgroundColor: '#1677ff0f',
                            border: '1px solid #1677ff34',
                            borderRadius: '10px',
                            width: ' 35px',
                            margin: '5px -7px',
                        }}
                        type='link'
                        icon={<PlusOutlined/>}
                        onClick={clickAddConversation}
                    />
                </Tooltip>
                :
                <Button
                    className='h-35 w-[calc(100%-25px)] ml-3 m-4'
                    style={{
                        backgroundColor: '#1677ff0f',
                        border: '1px solid #1677ff34',
                        borderRadius: '10px',
                    }}
                    type={'link'}
                    icon={<PlusOutlined/>}
                    onClick={clickAddConversation}
                >
                    开启新对话
                </Button>
            }
        </>
    }

    // 点击添加会话
    const clickAddConversation = () => {
        setActiveKey('')
    }

    // 添加会话
    const addConversation = (msg: string) => {
        setConversationsItems([
            {
                key: `${conversationsItems.length + 1}`,
                label: msg,
            },
            ...conversationsItems,

        ]);
        setActiveKey(`${conversationsItems.length + 1}`);
    };

    // 会话编辑
    const menuConfig: ConversationsProps['menu'] = (conversation) => ({
        items: [
            {
                label: '重命名',
                key: 'rename',
                icon: <EditOutlined />,
            },
            {
                label: '删除',
                key: 'delete',
                icon: <DeleteOutlined />,
                danger: true,
            },
        ],
        onClick: (menuInfo) => {
            menuInfo.domEvent.stopPropagation();
            let updatedConversations: Conversation[];
            // 重命名会话
            if (menuInfo.key === 'rename') {
                Modal.confirm({
                    title: '重命名会话',
                    content: (
                        <Input
                            placeholder="请输入新的会话名称"
                            defaultValue={conversation.label?.toString()}
                            onChange={(e) => {
                                const newLabel = e.target.value;
                                updatedConversations = conversationsItems.map((item) =>
                                    item.key === conversation.key ? { ...item, label: newLabel } : item
                                );
                            }}
                        />
                    ),
                    onOk: () => {
                        setConversationsItems(updatedConversations);
                        apiMessage.success('重命名成功');
                    },
                    onCancel: () => {
                        apiMessage.info('取消重命名');
                    },
                });
            }
            // 删除会话
            if (menuInfo.key === 'delete') {
                Modal.confirm({
                    title: '永久删除对话',
                    content: '删除后，该对话不可恢复，确认删除吗？',
                    okType: 'danger',
                    okText: '删除',
                    onOk: () => {
                        // 过滤掉当前选中的会话项
                        const updatedConversations = conversationsItems.filter(
                            (item) => item.key !== conversation.key
                        );
                        setConversationsItems(updatedConversations);
                        // 如果删除的是当前激活的会话，重置 activeKey
                        if (activeKey === conversation.key) {
                            setActiveKey(updatedConversations.length > 0 ? updatedConversations[0].key : '');
                        }
                        apiMessage.success('删除成功')
                    }
                });
            }
        },
    });

    // 会话管理列表
    const conversationRender = (props: SiderMenuProps, defaultDom: React.ReactNode) => {
        return <>
            {!props.collapsed &&
                <div className='h-full px-1 overflow-y-auto scrollbar-container'>
                    <Conversations
                        items={conversationsItems}
                        menu={menuConfig}
                        activeKey={activeKey}
                        onActiveChange={setActiveKey}
                    />
                </div>
    }
    </>
    }

    // actionsRender
    const actionsRender = (props: HeaderViewProps) => {
        return <HeaderActions headerProps={props} dark={dark} setDark={setDark}/>
    }

    // 用户头像
    const avatarRender: ProLayoutProps['avatarProps'] = {
        icon: (<UserOutlined/>),
        size: 'small',
        title: 'dawei',
        render: (_: any, avatarChildren: React.ReactNode) => {
            return <AvatarDropdown>{avatarChildren}</AvatarDropdown>;
        },
    }

    return (
        <AntdRegistry>
            <XProvider
                locale={zhCN}
                theme={customTheme}
            >
                <ProLayout
                    className='h-lvh'
                    token={proLayoutToken}
                    pure={false} // 是否删除自带页面
                    navTheme={'light'}
                    layout={'side'}
                    siderWidth={250}
                    logo={<Logo/>}
                    title='Dw Chat Lite'
                    menuHeaderRender={menuHeaderRender} // Logo Title
                    menuExtraRender={addConversationRender} // 开启新对话按钮
                    menuContentRender={conversationRender} // 会话管理
                    actionsRender={actionsRender}
                    avatarProps={avatarRender} // 用户头像
                    footerRender={() => (<Footer/>)}  // 页脚

                    collapsedButtonRender={false} // 去掉默认侧边栏
                    collapsed={open}
                    onCollapse={setOpen}
                >
               <ChatMessage
                   handleAddConversation={addConversation}
               />
                </ProLayout>
            </XProvider>
        </AntdRegistry>
    );
};

export default ChatPage;