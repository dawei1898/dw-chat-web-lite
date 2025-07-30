import React from 'react';
import {Actions, ActionsProps} from "@ant-design/x";
import {message} from "antd";
import {CopyOutlined, DislikeOutlined, LikeOutlined} from "@ant-design/icons";
import {writeText} from "clipboard-polyfill";
import {ActionItem} from "@ant-design/x/es/actions/interface";


/**
 * 聊天气泡底部操作区
 */
const BubbleActions = ({content}: { content: string }) => {
    const [messageApi, contextHolder] = message.useMessage();

    const actionItems: ActionsProps['items'] = [
        {
            key: 'like',
            label: '喜欢',
            icon: <LikeOutlined/>,
            onItemClick: () => messageApi.success('感谢您的支持'),
        },
        {
            key: 'dislike',
            label: '不喜欢',
            icon: <DislikeOutlined/>,
            onItemClick: () => messageApi.info('感谢您的反馈'),
        },
        {
            key: 'copy',
            label: '复制',
            icon: <CopyOutlined/>,
            onItemClick: (info?: ActionItem) => {
                writeText(content);
                messageApi.success('已复制');
            }
        },
    ]

    return (
        <>
            {contextHolder}
            <Actions items={actionItems}/>
        </>
    );
};

export default BubbleActions;