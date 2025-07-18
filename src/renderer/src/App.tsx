import React, { useState, useEffect } from 'react'
import { Layout, Button } from 'antd'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import MemberManagement from './pages/MemberManagement'
import ServiceManagement from './pages/ServiceManagement'
import Consumption from './pages/Consumption'
import Recharge from './pages/Recharge'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Login from './pages/Login'
import EmployeeManagement from './pages/EmployeeManagement'
import './App.scss'

const { Content } = Layout

function App(): React.JSX.Element {
  const [currentPath, setCurrentPath] = useState('/')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // 处理路径，在Electron应用中只获取相对路径部分
  const getRelativePath = (fullPath: string) => {
    // 如果是Electron应用，路径可能包含文件系统路径
    // 例如: /D:/members 或 /C:/path/to/app/members
    // 我们需要提取最后的相对路径部分
    const pathParts = fullPath.split('/')

    // 查找最后一个有效的路径段
    for (let i = pathParts.length - 1; i >= 0; i--) {
      const part = pathParts[i]
      if (part && part !== 'D:' && part !== 'C:' && !part.includes(':')) {
        // 找到有效的路径段，返回从该段开始的路径
        return '/' + pathParts.slice(i).join('/')
      }
    }

    // 如果没有找到有效路径，返回根路径
    return '/'
  }

  // 登录状态初始化
  useEffect(() => {
    const loginStatus = localStorage.getItem('isLoggedIn') === 'true'
    setIsLoggedIn(loginStatus)
  }, [])

  // 监听路由变化
  useEffect(() => {
    const handleRouteChange = () => {
      const fullPath = window.location.pathname
      const newPath = getRelativePath(fullPath)
      console.log('Full path:', fullPath, 'Relative path:', newPath)
      setCurrentPath(newPath)
    }

    // 初始化当前路径
    const initialPath = getRelativePath(window.location.pathname)
    const validPaths = [
      '/',
      '/members',
      '/services',
      '/consumption',
      '/recharge',
      '/reports',
      'employeemanagement',
      '/settings'
    ]
    if (!validPaths.includes(initialPath)) {
      window.history.pushState({}, '', '/')
      setCurrentPath('/')
    } else {
      setCurrentPath(initialPath)
    }

    // 监听popstate事件（浏览器前进后退）
    window.addEventListener('popstate', handleRouteChange)

    // 监听自定义路由变化事件
    window.addEventListener('routeChange', handleRouteChange)

    return () => {
      window.removeEventListener('popstate', handleRouteChange)
      window.removeEventListener('routeChange', handleRouteChange)
    }
  }, [])

  // 退出登录
  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn')
    setIsLoggedIn(false)
  }

  // 根据当前路径渲染对应的组件
  const renderContent = () => {
    console.log('Rendering content for path:', currentPath)
    switch (currentPath) {
      case '/':
        return <Dashboard />
      case '/members':
        return <MemberManagement />
      case '/services':
        return <ServiceManagement />
      case '/consumption':
        return <Consumption />
      case '/recharge':
        return <Recharge />
      case '/reports':
        return <Reports />
      case '/employeemanagement':
        return <EmployeeManagement />
      case '/settings':
        return <Settings />
      default:
        // 如果路径不匹配，重定向到首页
        window.history.pushState({}, '', '/')
        setCurrentPath('/')
        return <Dashboard />
    }
  }

  // 未登录时只显示登录页面
  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />
  }

  return (
    <Layout className="app-layout">
      {/* <AppHeader /> */}
      <Layout>
        <Sidebar />
        <Content className="app-content">
          <div style={{ textAlign: 'right', marginBottom: 16 }}>
            <Button onClick={handleLogout}>退出登录</Button>
          </div>
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  )
}

export default App
