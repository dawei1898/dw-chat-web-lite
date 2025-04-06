"use client"
import React, {useEffect, useRef, useState} from 'react';
import dynamic from 'next/dynamic';
import {
    Bubble,
    Conversations,
    ConversationsProps,
    Sender,
    useXAgent,
    useXChat,
    XProvider
} from "@ant-design/x";
import {
    Button, GetProp, Space,
    message as apiMessage,
    Tooltip, theme,
    ThemeConfig, Flex, Modal, Input
} from "antd";
import {
    CopyOutlined, DeleteOutlined, DislikeOutlined, EditOutlined,
    GlobalOutlined, LikeOutlined,
    NodeIndexOutlined, PaperClipOutlined,
    PlusOutlined, UserOutlined,
} from "@ant-design/icons";
import '@ant-design/v5-patch-for-react-19'; // 兼容 React19
import {AntdRegistry} from "@ant-design/nextjs-registry";
import {DeepSeekIcon, PanelLeftClose, PanelLeftOpen} from "@/components/Icons";
import OpenAI from "openai";
import {BubbleDataType} from "@ant-design/x/es/bubble/BubbleList";
import MarkdownRender from "@/app/chat/markdown-render";
import InitWelcome from "@/app/chat/init-welcome";
import Logo from "@/app/chat/logo";
import zhCN from "antd/locale/zh_CN";
import {ProLayoutProps} from '@ant-design/pro-components';
import AvatarDropdown from "@/app/chat/avatar-dropdown";
import Footer from "@/app/chat/footer";
import HeaderActions from "@/app/chat/header-actions";
import type {ProTokenType} from "@ant-design/pro-provider";
import {SiderMenuProps} from "@ant-design/pro-layout/es/components/SiderMenu/SiderMenu";
import type {HeaderViewProps} from "@ant-design/pro-layout/es/components/Header";
import {Conversation} from "@ant-design/x/es/conversations";
import {writeText} from "clipboard-polyfill";


// 动态导入
const ProLayout = dynamic(
    () => import('@ant-design/pro-components').then(mod => mod.ProLayout),
    { ssr: false }
);
const {useToken} = theme;

const defaultConversationsItems: GetProp<ConversationsProps, 'items'> = []

/**
 * DeepSeek大模型配置
 */
const MODEL_CHAT = 'deepseek-chat'
const MODEL_REASONER = 'deepseek-reasoner'

const client = new OpenAI({
    baseURL: process.env.NEXT_PUBLIC_DEEPSEEK_BASE_URL,
    apiKey: process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY,
    dangerouslyAllowBrowser: true,
});


const ChatPage = () => {
    const {token} = useToken();
    const [dark, setDark] = useState(false);
    const [conversationsItems, setConversationsItems] = useState(defaultConversationsItems);
    const [inputTxt, setInputTxt] = useState<string>('')
    const [requestLoading, setRequestLoading] = useState<boolean>(false)
    const [activeKey, setActiveKey] = useState<string>('')
    const [openSearch, setOpenSearch] = useState<boolean>(false)
    const [openReasoner, setOpenReasoner] = useState<boolean>(false)
    const [model, setModel] = useState<string>(MODEL_CHAT)
    const modelRef = useRef(model);
    const abortControllerRef = useRef<AbortController>(null);
    const [collapsed, setCollapsed] = useState(false);


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
            paddingInlinePageContainerContent: 10, // 左右内距离
        },
    }

    /* 侧边栏触发器 */
    const SidebarTrigger = (
        <Tooltip
            title={collapsed ? '打开边栏' : '收起边栏'}
            placement='right'
        >
            <Button
                styles={{icon: {color: '#676767'}}}
                type='text'
                icon={collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
                onClick={() => setCollapsed(!collapsed)}
            />
        </Tooltip>
    )

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
        setMessages([])
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
                    title: '删除会话',
                    content: '确认删除该会话吗？',
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
                <Conversations
                    className='px-12 overflow-y-auto'
                    items={conversationsItems}
                    menu={menuConfig}
                    activeKey={activeKey}
                    onActiveChange={setActiveKey}
                />
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


    /**
     * 与大模型交互
     */
    const [agent] = useXAgent({
        request: async (info, callbacks) => {
            const {message, messages} = info
            const {onUpdate, onSuccess, onError} = callbacks
            console.log('message', message)
            console.log('message list', messages)
            console.log('model:', modelRef.current)

            let content = ''
            let reasoningContent: string = '==========  思考开始  ==========\n'
            let reasoningOver: boolean = false
            try {
                const streamCompletions = await client.chat.completions.create({
                        model: modelRef.current,
                        messages: [{role: 'user', content: message || ''}],
                        stream: true
                    },
                    {
                        signal: abortControllerRef.current?.signal, // 控制停止
                    });
                for await (let chunk of streamCompletions) {
                    setRequestLoading(false);
                    const reasoning_content: string = (chunk.choices[0]?.delta as any)?.reasoning_content
                    const resp_content: any = chunk.choices[0]?.delta?.content

                    // 思考中
                    if (reasoning_content) {
                        reasoningContent += reasoning_content;
                        content = reasoningContent;
                    }
                    // 思考结束
                    else if (modelRef.current === MODEL_REASONER
                        && resp_content && !reasoningOver) {
                        reasoningContent += '\n==========  思考结束  ==========\n\n\n';
                        content = reasoningContent;
                        reasoningOver = true;
                        console.log('思考结束。')
                    }
                    // 回答
                    if (resp_content) {
                        content += resp_content;
                    }
                    onUpdate(content);
                }

                onSuccess(content);
            } catch (e) {
                console.log('error', e);
                onError(e as Error);
            } finally {
                setRequestLoading(false);
            }
        }
    });

    const {onRequest, messages, setMessages} = useXChat({
        agent: agent,
        requestPlaceholder: '请求中...',
    });

    useEffect(() => {
        const newModel = openReasoner ? MODEL_REASONER : MODEL_CHAT;
        setModel(newModel)
        modelRef.current = newModel
        console.log('set model:', newModel)
    }, [openReasoner]);

    useEffect(() => {
        modelRef.current = model;
    }, [model]);


    const MessageFooter = (props: {message: string}) => {
        return <Space>
            <Tooltip title='喜欢'>
                <Button
                    size={'small'} type={'text'} icon={<LikeOutlined/>}
                    onClick={() => apiMessage.success('感谢您的支持')}
                />
            </Tooltip>
            <Tooltip title='不喜欢'>
                <Button
                    size={'small'} type={'text'} icon={<DislikeOutlined/>}
                    onClick={() => apiMessage.info('感谢您的反馈')}
                />
            </Tooltip>
            <Tooltip title='复制'>
                <Button
                    size={'small'} type={'text'} icon={<CopyOutlined/>}
                    onClick={() => {
                        writeText(props.message);
                        apiMessage.success('已复制');
                    }}
                />
            </Tooltip>
        </Space>
    }



    // 角色格式设定
    const roles: GetProp<typeof Bubble.List, 'roles'> = {
        ai: {
            placement: 'start',
            variant: 'outlined',
            avatar: {icon: <DeepSeekIcon/>, style: {border: '1px solid #c5eaee', backgroundColor: 'white'}},
            //footer: !agent.isRequesting() && MessageFooter,
            typing: {step: 5, interval: 50},
            messageRender: (content) => (<MarkdownRender content={content}/>),
            style: {
                maxWidth: 700,
            },
            styles: {
                //content: {border: "none"}
            }
        },
        user: {
            placement: 'end',
        },
    };

    const messageItems = messages.map((
        {id, message, status}) =>
        ({
            key: id,
            content: message,
            role: status === 'local' ? 'user' : 'ai',
            loading: status === 'loading' && requestLoading,
            footer: ((!agent.isRequesting() && status !== 'local') &&
                <MessageFooter message={message}/>
            ),
        }));

    // 发送消息
    const handleSubmit = (msg: string) => {
        onRequest(msg);
        setInputTxt('');
        setRequestLoading(true);
        if (!activeKey) {
            addConversation(msg);
        }
    }

    const finalMessageItems: BubbleDataType[] = messageItems.length > 0 ? messageItems
        : [{
            content: (<InitWelcome handleSubmit={handleSubmit}/>),
            variant: 'borderless'
        }];


    /* 自定义发送框底部 */
    const senderFooter =  ({components}: any) => {
        const {SendButton, LoadingButton, SpeechButton} = components;

        return (
            <Flex justify='space-between' align='center'>
                <Flex gap='small'>
                    <Tooltip
                        title={openReasoner ? '' : '调用新模型 DeepSeek-R1，解决推理问题'}
                        placement='left'
                    >
                        <Button
                            size='small'
                            shape='round'
                            type={openReasoner ? 'primary' : 'default'}
                            onClick={() => setOpenReasoner(!openReasoner)}
                        >
                            <NodeIndexOutlined />
                            深度思考(R1)
                        </Button>
                    </Tooltip>
                    <Tooltip
                        title={openSearch ? '' : '按需搜索网页'}
                        placement='right'
                    >
                        <Button
                            size='small'
                            shape='round'
                            type={openSearch ? 'primary' : 'default'}
                            onClick={() => setOpenSearch(!openSearch)}
                        >
                            <GlobalOutlined />
                            联网搜索
                        </Button>
                    </Tooltip>
                </Flex>

                <Flex  align='center' gap='small'>
                    <Tooltip title={'上传附件'} placement='top'>
                        <Button
                            type='text'
                            icon={<PaperClipOutlined rotate={135} style={{fontSize: '18px', marginTop: '7px'}}/>}
                        />
                    </Tooltip>
                    {
                        !agent.isRequesting() ?
                            (
                                <Tooltip title={inputTxt ? '发送' : '请输入你的问题'}>
                                    <SendButton/>
                                </Tooltip>)
                            : (
                                <Tooltip title='停止'>
                                    <LoadingButton/>
                                </Tooltip>
                            )
                    }
                </Flex>

        </Flex>
        );
    }


    // 停止
    const handleCancel = () => {
        setRequestLoading(false);
        abortControllerRef.current?.abort('停止');
        apiMessage.error('已停止')
    }

    // 通过 useEffect 清理函数自动取消未完成的请求：
    useEffect(() => {
        abortControllerRef.current = new AbortController();
        return () => {
            abortControllerRef.current?.abort('停止');
        }
    }, []);

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
                    title='Dw Chat Mini'
                    menuHeaderRender={menuHeaderRender} // Logo Title
                    menuExtraRender={addConversationRender} // 开启新对话按钮
                    menuContentRender={conversationRender} // 会话管理
                    actionsRender={actionsRender}
                    avatarProps={avatarRender} // 用户头像
                    footerRender={() => (<Footer/>)}  // 页脚

                    collapsedButtonRender={false} // 去掉默认侧边栏
                    collapsed={collapsed}
                    onCollapse={setCollapsed}
                >
                    <div className='fixed z-10 h-12 w-12'>
                        {SidebarTrigger}
                    </div>

                    <Flex
                        vertical
                        gap={'large'}
                        className='w-full max-w-2xl'
                        style={{margin: '0px auto', height: '94.5vh'}}
                    >
                        {/* 消息列表 */}
                        <Bubble.List
                            roles={roles}
                            items={finalMessageItems}
                        />

                        {/* 输入框 */}
                        <Sender
                            style={{marginTop: 'auto', borderRadius: '20px'}}
                            autoSize={{minRows: 2, maxRows: 8}}
                            placeholder='请输入你的问题...'
                            loading={agent.isRequesting()}
                            value={inputTxt}
                            onChange={setInputTxt}
                            onSubmit={handleSubmit}
                            onCancel={handleCancel}
                            actions={false}
                            footer={senderFooter}
                        />
                    </Flex>
                </ProLayout>
            </XProvider>
        </AntdRegistry>
    );
};

export default ChatPage;