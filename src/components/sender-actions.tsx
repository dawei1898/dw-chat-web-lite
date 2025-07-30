import React from 'react';
import {Button, ButtonProps, Flex, Tooltip} from "antd";
import {GlobalOutlined, NodeIndexOutlined, PaperClipOutlined} from "@ant-design/icons";
import {useChat} from "@/provider/chat-provider";

export type ActionsComponents = {
    SendButton: React.ComponentType<ButtonProps>;
    ClearButton: React.ComponentType<ButtonProps>;
    LoadingButton: React.ComponentType<ButtonProps>;
    SpeechButton: React.ComponentType<ButtonProps>;
};

interface SenderActionsProps {
    components: any,
    inputTxt: string,
    loading: boolean,
}

/**
 * 发送框操作区组件
 */
const SenderActions = (
    {components, inputTxt, loading}: SenderActionsProps
) => {
    const {SendButton, LoadingButton, SpeechButton, ClearButton} = components;
    const {openReasoner, openSearch, setOpenReasoner, setOpenSearch} = useChat();


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
                        <NodeIndexOutlined/>
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
                        <GlobalOutlined/>
                        联网搜索
                    </Button>
                </Tooltip>
            </Flex>

            <Flex align='center' gap='small'>
                <Tooltip title={'上传附件'} placement='top'>
                    <Button
                        type='text'
                        icon={<PaperClipOutlined rotate={135} style={{fontSize: '18px', marginTop: '7px'}}/>}
                    />
                </Tooltip>
                {
                    !loading ?
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
};

export default SenderActions;