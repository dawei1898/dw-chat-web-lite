import React from 'react';
import {Button, Space} from "antd";
import {Prompts, PromptsProps, Welcome} from "@ant-design/x";
import {
    CommentOutlined,
    EllipsisOutlined,
    FireOutlined,
    HeartOutlined,
    ReadOutlined,
    ShareAltOutlined,
    SmileOutlined
} from "@ant-design/icons";


const renderTitle = (icon: React.ReactElement, title: string) => (
    <Space align="start">
        {icon}
        <span>{title}</span>
    </Space>
);

const promptItems: PromptsProps['items'] = [
    {
        key: '1',
        label: renderTitle(<FireOutlined style={{color: '#FF4D4F'}}/>, 'Hot Topics'),
        description: 'What are you interested in?',
        children: [
            {
                key: '1-1',
                description: `What's new in X?`,
            },
            {
                key: '1-2',
                description: `What's AGI?`,
            },
            {
                key: '1-3',
                description: `Where is the doc?`,
            },
        ],
    },
    {
        key: '2',
        label: renderTitle(<ReadOutlined style={{color: '#1890FF'}}/>, 'Design Guide'),
        description: 'How to design a good product?',
        children: [
            {
                key: '2-1',
                icon: <HeartOutlined/>,
                description: `Know the well`,
            },
            {
                key: '2-2',
                icon: <SmileOutlined/>,
                description: `Set the AI role`,
            },
            {
                key: '2-3',
                icon: <CommentOutlined/>,
                description: `Express the feeling`,
            },
        ],
    }
];


type Props = {
    handleSubmit: (value: string) => void;
}

/**
 * 初始态的欢迎语和提示词
 */
const InitWelcome = (props: Props) => {
    //const {styles} = useStyle();

    return (
        <Space
            className='pt-10'
            direction='vertical'
            size={16}
        >
            {/* 欢迎语 */}
            <Welcome
                variant="borderless"
                icon="https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*s5sNRo5LjfQAAAAAAAAAAAAADgCCAQ/fmt.webp"
                title="Hello, I'm Ant Design X"
                description="Base on Ant Design, AGI product interface solution, create a better intelligent vision~"
                extra={
                    <Space>
                        <Button icon={<ShareAltOutlined/>}/>
                        <Button icon={<EllipsisOutlined/>}/>
                    </Space>
                }
            />
            {/* 提示词 */}
            <Prompts
                title={'Do you want?'}
                items={promptItems}
                styles={{
                    list: {
                        width: '100%',
                    },
                    item: {
                        flex: 1,
                    }
                }}
                onItemClick={({data}) => {
                    if (data.description) {
                        props.handleSubmit(data.description.toString())
                    }
                }}
            />
        </Space>
    );
};

export default InitWelcome;