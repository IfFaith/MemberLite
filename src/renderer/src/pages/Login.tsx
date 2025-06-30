import React, { useState } from 'react'
import { Form, Input, Button, Card } from 'antd'
import { toast } from '../components/Toast'

const USERNAME = 'admin'
const DEFAULT_PASSWORD = '123456'

const Login: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false)

  // 获取当前密码（优先localStorage）
  const getCurrentPassword = () => {
    return localStorage.getItem('loginPassword') || DEFAULT_PASSWORD
  }

  const onFinish = (values: { username: string; password: string }) => {
    setLoading(true)
    if (values.username === USERNAME && values.password === getCurrentPassword()) {
      localStorage.setItem('isLoggedIn', 'true')
      toast.success('登录成功！')
      onLogin()
    } else {
      toast.error('账号或密码错误')
    }
    setLoading(false)
  }

  return (
    <div style={{ width: 400, margin: '0 auto', position: 'relative', top: '120px' }}>
      <Card title="登录" bordered={false}>
        <div style={{color:'#e6ba3c',fontSize:'12px'}}>
          默认账号：admin 默认密码123456  密码可在系统设置中修改
        </div>
        <Form name="login" initialValues={{ remember: true }} onFinish={onFinish}>
          <Form.Item name="username" rules={[{ required: true, message: '请输入账号' }]}>
            <Input placeholder="账号" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default Login
