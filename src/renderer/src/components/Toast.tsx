import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined, InfoCircleOutlined } from '@ant-design/icons'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  onClose?: () => void
}

const Toast: React.FC<ToastProps> = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => {
        onClose?.()
      }, 300) // 等待动画结束
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />
      case 'error':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
      case 'warning':
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />
      default:
        return <InfoCircleOutlined style={{ color: '#1890ff' }} />
    }
  }

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#f6ffed'
      case 'error':
        return '#fff2f0'
      case 'warning':
        return '#fffbe6'
      default:
        return '#e6f7ff'
    }
  }

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return '#b7eb8f'
      case 'error':
        return '#ffccc7'
      case 'warning':
        return '#ffe58f'
      default:
        return '#91d5ff'
    }
  }

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        padding: '12px 16px',
        borderRadius: '6px',
        backgroundColor: getBackgroundColor(),
        border: `1px solid ${getBorderColor()}`,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        minWidth: '200px',
        maxWidth: '400px',
        fontSize: '14px',
        color: '#333',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'all 0.3s ease',
        cursor: 'pointer'
      }}
      onClick={() => {
        setVisible(false)
        setTimeout(() => onClose?.(), 300)
      }}
    >
      {getIcon()}
      <span>{message}</span>
    </div>
  )
}

// Toast管理器
class ToastManager {
  private container: HTMLDivElement | null = null
  private root: any = null

  constructor() {
    this.createContainer()
  }

  private createContainer() {
    this.container = document.createElement('div')
    this.container.id = 'toast-container'
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      z-index: 9999;
      pointer-events: none;
    `
    document.body.appendChild(this.container)
    this.root = createRoot(this.container)
  }

  show(options: { message: string; type?: 'success' | 'error' | 'warning' | 'info'; duration?: number }) {
    if (!this.container) {
      this.createContainer()
    }

    const toastId = Date.now()
    const ToastComponent = (
      <div key={toastId} style={{ pointerEvents: 'auto', marginBottom: '8px' }}>
        <Toast
          message={options.message}
          type={options.type}
          duration={options.duration}
          onClose={() => {
            // 可以在这里清理toast
          }}
        />
      </div>
    )

    // 渲染toast
    this.root.render(ToastComponent)
  }

  success(message: string, duration?: number) {
    this.show({ message, type: 'success', duration })
  }

  error(message: string, duration?: number) {
    this.show({ message, type: 'error', duration })
  }

  warning(message: string, duration?: number) {
    this.show({ message, type: 'warning', duration })
  }

  info(message: string, duration?: number) {
    this.show({ message, type: 'info', duration })
  }
}

// 创建全局toast实例
export const toast = new ToastManager()

export default Toast 