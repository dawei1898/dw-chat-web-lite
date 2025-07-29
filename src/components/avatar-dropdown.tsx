import React from 'react';
import {Dropdown, MenuProps} from "antd";
import {
    LogoutOutlined, SettingOutlined
} from "@ant-design/icons";
import Link from "next/link";


// 用户头像下拉菜单项
const items: MenuProps['items'] = [
    {
        key: 'setting',
        label: '个人设置',
        icon: (<SettingOutlined/>),
    },
    {
        key: 'logout',
        label: (<Link href='/login'>{'退出登录'}</Link>),
        icon: (<LogoutOutlined/>),
    },

]


/**
 * 头像下拉组件
 */
const AvatarDropdown = ({children}: { children: React.ReactNode }) => {
    return (
        <div>
            <Dropdown
                menu={{items}}
                placement={'bottom'}
            >
                {children}
            </Dropdown>

        </div>
    );
};

export default AvatarDropdown;