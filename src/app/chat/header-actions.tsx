import React from 'react';
import {HeaderViewProps} from "@ant-design/pro-layout/es/components/Header";
import {Button, Input} from "antd";
import {GithubFilled, MoonFilled, SunOutlined} from "@ant-design/icons";
import Link from "next/link";

type HeaderActions = {
    headerProps: HeaderViewProps,
    dark: boolean,
    setDark: (value: boolean) => void,
}

const HeaderActions = (props: HeaderActions) => {
    if (props.headerProps.isMobile) return [];

    return [
        /* 亮暗模式切换 */
        <Button
            key='dark'
            type='text'
            shape='circle'
            onClick={() => props?.setDark(!props.dark)}
        >
            {props.dark ?
                <MoonFilled style={{fontSize: '18px'}}/>
                : <SunOutlined style={{fontSize: '18px'}}/>
            }
        </Button>,

        /* Github */
        <Link
            key='github_link'
            href='https://github.com/dawei1898/dw-chat-mini-web'
            target="_blank"
        >
            <Button key='github' type='text' shape='circle'>
                <GithubFilled style={{fontSize: '18px'}}/>
            </Button>
        </Link>,
    ];
};

export default HeaderActions;