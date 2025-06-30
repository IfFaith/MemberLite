import React, { useState, useEffect } from 'react'
import { Layout, Menu } from 'antd'
import logo from '../assets/images/icon.png'
import {
  DashboardOutlined,
  UserOutlined,
  SettingOutlined,
  ShoppingOutlined,
  WalletOutlined,
  BarChartOutlined,
  ToolOutlined
} from '@ant-design/icons'

const { Sider } = Layout

const Sidebar: React.FC = () => {
  const [selectedKey, setSelectedKey] = useState('/')

  // 在组件挂载时根据当前路径设置选中的菜单项
  useEffect(() => {
    const pathname = window.location.pathname
    // 处理Electron应用中的路径问题
    const pathParts = pathname.split('/')
    let cleanPath = '/'
    
    // 查找最后一个有效的路径段
    for (let i = pathParts.length - 1; i >= 0; i--) {
      const part = pathParts[i]
      if (part && part !== 'D:' && part !== 'C:' && !part.includes(':')) {
        cleanPath = '/' + pathParts.slice(i).join('/')
        break
      }
    }
    
    // 如果路径不在菜单项中，默认选中总览
    const validPaths = ['/', '/members', '/services', '/consumption', '/recharge', '/reports', '/settings']
    if (!validPaths.includes(cleanPath)) {
      cleanPath = '/'
    }
    
    setSelectedKey(cleanPath)
  }, [])

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '总览'
    },
    {
      key: '/members',
      icon: <UserOutlined />,
      label: '会员管理'
    },
    {
      key: '/services',
      icon: <ToolOutlined />,
      label: '服务项目'
    },
    {
      key: '/consumption',
      icon: <ShoppingOutlined />,
      label: '消费扣费'
    },
    {
      key: '/recharge',
      icon: <WalletOutlined />,
      label: '会员充值'
    },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: '统计报表'
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '系统设置'
    }
  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    setSelectedKey(key)
    // 在Electron应用中，我们需要确保路径格式正确
    // 直接使用相对路径，避免文件系统路径问题
    const cleanPath = key.startsWith('/') ? key : '/' + key
    window.history.pushState({}, '', cleanPath)
    // 触发自定义事件通知应用路由变化
    window.dispatchEvent(new CustomEvent('routeChange'))
  }

  return (
    <Sider width={200} className="app-sidebar">
      <div className="sidebar-logo">
        <img src={logo} alt="" width={80}/>
        <h2>貔貅会员管理</h2>
      </div>
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        style={{ height: '100%', borderRight: 0 }}
        items={menuItems}
        onClick={handleMenuClick}
      />
    </Sider>
  )
}

export default Sidebar 