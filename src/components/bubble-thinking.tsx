import React, {useState} from 'react';
import {Button, Flex, theme, Typography} from "antd";
import {DownOutlined, NodeIndexOutlined, UpOutlined} from "@ant-design/icons";

const {useToken} = theme;


/**
 * 消息气泡-思考过程 组件
 */
const BubbleThinking = ({content}: {content: string}) => {
    const {token} = useToken();
    const [open, setOpen] = useState<boolean>(true)

    return (content &&
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
                        {content}
                    </Typography.Text>
                </div>
            }
        </Flex>
    )
};

export default BubbleThinking;