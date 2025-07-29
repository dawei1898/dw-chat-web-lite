import React from 'react';
import {useChat} from "@/provider/chat-provider";
import {Button, Tooltip} from "antd";
import {PanelLeftClose, PanelLeftOpen} from "@/components/Icons";

/**
 *  侧边栏触发器
 */
const SidebarTrigger = () => {
    const {open, setOpen} = useChat();

    return (
        <>
            <Tooltip
                title={open ? '打开边栏' : '收起边栏'}
                placement='right'
            >
                <Button
                    styles={{icon: {color: '#676767'}}}
                    type='text'
                    icon={open ? <PanelLeftOpen /> : <PanelLeftClose />}
                    onClick={() => setOpen(!open)}
                />
            </Tooltip>
        </>
    );
};

export default SidebarTrigger;