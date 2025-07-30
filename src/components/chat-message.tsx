"use client"

import React, {useEffect, useRef, useState} from 'react';
import SidebarTrigger from "@/components/sidebar-trigger";
import {Button, Flex, message as apiMessage, Space, theme, Tooltip, Typography} from "antd";
import {Bubble, Sender, useXAgent, useXChat} from "@ant-design/x";
import OpenAI from "openai";
import {
    CopyOutlined,
    DislikeOutlined,
    DownOutlined, GlobalOutlined,
    LikeOutlined,
    NodeIndexOutlined, PaperClipOutlined,
    UpOutlined
} from "@ant-design/icons";
import {DeepSeekIcon} from "@/components/Icons";
import MarkdownRender from "@/components/markdown-render";
import {BubbleDataType} from "@ant-design/x/es/bubble/BubbleList";
import InitWelcome from "@/components/init-welcome";
import {useChat} from "@/provider/chat-provider";
import BubbleFooter from "@/components/bubble-footer";




/**
 * DeepSeek大模型配置
 */
/*const MODEL_CHAT = 'deepseek-chat'
const MODEL_REASONER = 'deepseek-reasoner'*/

const MODEL_CHAT = process.env.NEXT_PUBLIC_DEEPSEEK_CHAT_MODEL || ''
const MODEL_REASONER = process.env.NEXT_PUBLIC_DEEPSEEK_REASONERT_MODEL || ''

const client = new OpenAI({
    baseURL: process.env.NEXT_PUBLIC_DEEPSEEK_BASE_URL,
    apiKey: process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY,
    dangerouslyAllowBrowser: true,
});

export type AgentMessage = {
    content?: string;
    reasoningContent?: string;
};

const {useToken} = theme;



interface ChatMessageProps {
    handleAddConversation: (msg: string) => void;
}

const ChatMessage = (
    {handleAddConversation}: ChatMessageProps
) => {
    const {token} = useToken();
    const {activeKey} = useChat();
    const [inputTxt, setInputTxt] = useState<string>('')
    const [requestLoading, setRequestLoading] = useState<boolean>(false)
    const [openSearch, setOpenSearch] = useState<boolean>(false)
    const [openReasoner, setOpenReasoner] = useState<boolean>(false)
    const [model, setModel] = useState<string>(MODEL_CHAT)
    const modelRef = useRef(model);
    const abortControllerRef = useRef<AbortController>(null);


    /**
     * 与大模型交互
     */
    const [agent] = useXAgent<AgentMessage>({
        request: async (info, callbacks) => {
            const {message, messages} = info
            const {onUpdate, onSuccess, onError} = callbacks
            console.log('message: ', message)
            console.log('message list: ', messages)
            console.log('model: ', modelRef.current)

            const aiMessage: AgentMessage = {
                content: '',
                reasoningContent: '',
            }
            try {
                const streamCompletions = await client.chat.completions.create({
                        model: modelRef.current,
                        messages: [{role: 'user', content: message?.content || ''}],
                        stream: true
                    },
                    {
                        signal: abortControllerRef.current?.signal, // 控制停止
                    });
                for await (let chunk of streamCompletions) {
                    setRequestLoading(false);
                    const reasoning_content: string = (chunk.choices[0]?.delta as any)?.reasoning_content || (chunk.choices[0]?.delta as any)?.reasoning
                    const resp_content: any = chunk.choices[0]?.delta?.content
                    // 思考中
                    if (reasoning_content) {
                        aiMessage.reasoningContent += reasoning_content;
                    }
                    // 回答
                    if (resp_content) {
                        aiMessage.content += resp_content;
                    }
                    onUpdate(aiMessage)
                }

                onSuccess(aiMessage)
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
        requestPlaceholder: {
            content: '请求中...'
        },
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

    useEffect(() => {
        if (!activeKey) {
            setMessages([])
        }
    }, [activeKey])

    /**
     * 思考过程
     */
    const MessageHeader = ({reasoningContent}: {reasoningContent: string} ) => {
        const [open, setOpen] = useState<boolean>(true)

        return (reasoningContent &&
            <Flex vertical>
                <Button
                    style={{
                        width: '130px',
                        marginBottom: '5px',
                        borderRadius: token.borderRadiusLG,
                    }}
                    color="default"
                    variant="filled"
                    onClick={() => setOpen(!open)}
                >
                    <NodeIndexOutlined/>
                    {'深度思考'}
                    {open ? <UpOutlined style={{fontSize: '10px'}}/>
                        : <DownOutlined style={{fontSize: '10px'}}/>}
                </Button>
                {open &&
                    <div className='max-w-[600px] border-l-2 border-l-gray-100 my-2 mr-2 pl-4'>
                        <Typography.Text type='secondary'>
                            {reasoningContent}
                        </Typography.Text>
                    </div>
                }
            </Flex>
        )
    }

    const messageItems = messages.map((
        {id, message, status}) =>
        ({
            key: id,
            content: message.content || '',
            role: status === 'local' ? 'user' : 'ai',
            loading: status === 'loading' && requestLoading,
            header: (status !== 'local' && <MessageHeader reasoningContent={message.reasoningContent || ''}/>),
            footer: ((!agent.isRequesting() && status !== 'local') &&
                <BubbleFooter content={message.content || ''}/>
            ),
            placement: status !== 'local' ? 'start' : 'end',
            variant: status !== 'local' ? (message.content ? 'outlined' : 'borderless') : undefined,
            avatar: status !== 'local' ?
                {
                    icon: <DeepSeekIcon/>,
                    style: {border: '1px solid #c5eaee', backgroundColor: 'white'}
                } : undefined,
            typing: status !== 'local' && (status === 'loading' && requestLoading) ?
                {step: 5, interval: 50} : undefined,
            style: status !== 'local' ? {maxWidth: 700} : undefined,
            messageRender: status !== 'local' ?
                ((content: any) => (<MarkdownRender content={content}/>)) : undefined,
        }));

    // 发送消息
    const handleSubmit = (msg: string) => {
        onRequest({content: msg});
        setInputTxt('');
        setRequestLoading(true);
        if (!activeKey) {
            handleAddConversation(msg);
        }
    }

    // @ts-ignore
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

    return (<>

        <div className='fixed z-10 h-12 w-12'>
            <SidebarTrigger/>
        </div>

        <Flex
            vertical
            gap={'large'}
            className='w-full'
            style={{margin: '0px auto', height: '94.5vh'}}
        >
            {/* 消息列表 */}
            <div className='h-full w-full px-1 overflow-y-auto scrollbar-container'>
                <Bubble.List
                    className='max-w-2xl  mx-auto'
                    //roles={roles}
                    items={finalMessageItems}
                />
            </div>

            {/* 输入框 */}
            <Sender
                className='max-w-2xl mx-auto'
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
    </>);
};

export default ChatMessage;