import React, { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Input,
  Button,
  Row,
  Col,
  Divider,
  Alert,
  Space,
  Modal,
  Table,
  Popconfirm,
  Tooltip
} from 'antd'
import {
  // SaveOutlined,
  DownloadOutlined,
  UploadOutlined,
  DeleteOutlined,
  ReloadOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { toast } from '../components/Toast'

interface BackupFile {
  fileName: string
  filePath: string
  fileSize: number
  createTime: string
  modifyTime: string
}

const DEFAULT_PASSWORD = '123456'

const Settings: React.FC = () => {
  // const [loading, setLoading] = useState(false)
  const [backupLoading, setBackupLoading] = useState(false)
  const [backupFiles, setBackupFiles] = useState<BackupFile[]>([])
  const [backupModalVisible, setBackupModalVisible] = useState(false)
  // const [restoreModalVisible, setRestoreModalVisible] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    loadBackupFiles()
  }, [])

  const loadBackupFiles = async () => {
    try {
      const result = await window.electronAPI.getBackupFiles()
      if (result.success && result.data) {
        setBackupFiles(result.data)
      }
    } catch (error) {
      console.error('加载备份文件失败:', error)
      toast.error('加载备份文件失败')
    }
  }

  // const handleSave = async () => {
  //   try {
  //     const values = await form.validateFields()
  //     setLoading(true)

  //     // 这里可以保存设置到数据库或配置文件
  //     console.log('保存设置:', values)

  //     toast.success('设置保存成功')
  //   } catch (error) {
  //     console.error('保存设置失败:', error)
  //     toast.error('保存设置失败')
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  const handleBackup = async () => {
    try {
      setBackupLoading(true)
      const result = await window.electronAPI.backupDatabase()

      if (result.success) {
        toast.success(`数据备份成功！文件大小: ${(result.data.fileSize / 1024).toFixed(2)} KB`)
        loadBackupFiles() // 重新加载备份文件列表
      } else {
        toast.error(`备份失败: ${result.error}`)
      }
    } catch (error) {
      toast.error('备份过程中发生错误')
      console.error('备份失败:', error)
    } finally {
      setBackupLoading(false)
    }
  }

  const handleRestore = async (backupFile: BackupFile) => {
    Modal.confirm({
      title: '确认数据恢复',
      content: (
        <div>
          <p>您确定要恢复以下备份文件吗？</p>
          <p>
            <strong>文件名:</strong> {backupFile.fileName}
          </p>
          <p>
            <strong>创建时间:</strong> {dayjs(backupFile.createTime).format('YYYY-MM-DD HH:mm:ss')}
          </p>
          <p>
            <strong>文件大小:</strong> {(backupFile.fileSize / 1024).toFixed(2)} KB
          </p>
          <Alert
            message="警告"
            description="恢复操作将覆盖当前所有数据，请确保已备份重要数据！"
            type="warning"
            showIcon
            style={{ marginTop: 16 }}
          />
        </div>
      ),
      okText: '确认恢复',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          setBackupLoading(true)
          const result = await window.electronAPI.restoreDatabase(backupFile.filePath)

          if (result.success) {
            toast.success('数据恢复成功！应用程序将重新加载...')
            // 延迟重新加载页面
            setTimeout(() => {
              window.location.reload()
            }, 2000)
          } else {
            toast.error(`恢复失败: ${result.error}`)
          }
        } catch (error) {
          toast.error('恢复过程中发生错误')
          console.error('恢复失败:', error)
        } finally {
          setBackupLoading(false)
        }
      }
    })
  }

  const handleDeleteBackup = async (backupFile: BackupFile) => {
    try {
      const result = await window.electronAPI.deleteBackup(backupFile.filePath)

      if (result.success) {
        toast.success('备份文件删除成功')
        loadBackupFiles() // 重新加载备份文件列表
      } else {
        toast.error(`删除失败: ${result.error}`)
      }
    } catch (error) {
      toast.error('删除过程中发生错误')
      console.error('删除失败:', error)
    }
  }

  const handleOpenDataDirectory = async () => {
    const result = await window.electronAPI.openDataDirectory();
    if (!result.success) {
        toast.error('打开失败: ' + result.error);
    }
  };

  const backupColumns = [
    {
      title: '文件名',
      dataIndex: 'fileName',
      key: 'fileName',
      render: (fileName: string) => (
        <Tooltip title={fileName}>
          <span
            style={{
              maxWidth: 200,
              display: 'inline-block',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {fileName}
          </span>
        </Tooltip>
      )
    },
    {
      title: '文件大小',
      dataIndex: 'fileSize',
      key: 'fileSize',
      width: 100,
      render: (fileSize: number) => `${(fileSize / 1024).toFixed(2)} KB`
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 150,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record: BackupFile) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<UploadOutlined />}
            onClick={() => handleRestore(record)}
            loading={backupLoading}
          >
            恢复
          </Button>
          <Popconfirm
            title="确定要删除这个备份文件吗？"
            onConfirm={() => handleDeleteBackup(record)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  // 获取当前密码
  const getCurrentPassword = () => {
    return localStorage.getItem('loginPassword') || DEFAULT_PASSWORD
  }

  const onFinish = (values: {
    oldPassword: string
    newPassword: string
    confirmPassword: string
  }) => {
    if (values.oldPassword !== getCurrentPassword()) {
      toast.error('原密码错误')
      return
    }
    if (values.newPassword !== values.confirmPassword) {
      toast.error('两次输入的新密码不一致')
      return
    }
    localStorage.setItem('loginPassword', values.newPassword)
    toast.success('密码修改成功！下次登录请使用新密码')
    form.resetFields()
  }

  return (
    <div className="page-container">
      <h1>系统设置</h1>

      <Row gutter={[24, 24]}>
        {/* <Col xs={24} lg={16}>
          <Card title="基本设置">
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                shopName: '貔貅会员管理系统',
                shopAddress: '',
                shopPhone: '',
                shopEmail: '',
                currency: 'CNY',
                timezone: 'Asia/Shanghai'
              }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="shopName"
                    label="店铺名称"
                    rules={[{ required: true, message: '请输入店铺名称' }]}
                  >
                    <Input placeholder="请输入店铺名称" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="shopPhone"
                    label="联系电话"
                  >
                    <Input placeholder="请输入联系电话" />
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item
                name="shopAddress"
                label="店铺地址"
              >
                <Input placeholder="请输入店铺地址" />
              </Form.Item>
              
              <Form.Item
                name="shopEmail"
                label="邮箱地址"
                rules={[
                  { type: 'email', message: '请输入正确的邮箱地址' }
                ]}
              >
                <Input placeholder="请输入邮箱地址" />
              </Form.Item>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="currency"
                    label="货币单位"
                  >
                    <Input placeholder="货币单位" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="timezone"
                    label="时区设置"
                  >
                    <Input placeholder="时区设置" />
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item>
                <Button 
                  type="primary" 
                  icon={<SaveOutlined />}
                  onClick={handleSave}
                  loading={loading}
                >
                  保存设置
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col> */}
        <Col xs={24} lg={16}>
          <Card title="修改登录密码" style={{ maxWidth: 400, marginTop: 24 }}>
            <Form form={form} onFinish={onFinish}>
              <Form.Item
                label="原密码"
                name="oldPassword"
                rules={[{ required: true, message: '请输入原密码' }]}
              >
                <Input.Password />
              </Form.Item>
              <Form.Item
                label="新密码"
                name="newPassword"
                rules={[{ required: true, message: '请输入新密码' }]}
              >
                <Input.Password />
              </Form.Item>
              <Form.Item
                label="确认新密码"
                name="confirmPassword"
                rules={[{ required: true, message: '请再次输入新密码' }]}
              >
                <Input.Password />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" block>
                  修改密码
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="数据管理">
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Button
                block
                type="primary"
                onClick={handleBackup}
                icon={<DownloadOutlined />}
                loading={backupLoading}
              >
                数据备份
              </Button>
              <Button block onClick={() => setBackupModalVisible(true)} icon={<FileTextOutlined />}>
                备份管理
              </Button>
              <Row align="middle" justify="space-between">
                <Col>
                  <p style={{ margin: 0 }}><strong>打开数据目录</strong></p>
                  <p style={{ margin: 0, color: '#888' }}>
                    直接在文件管理器中打开数据文件(.db)所在的文件夹，方便手动备份或清理。
                  </p>
                </Col>
                <Col>
                  <Button onClick={handleOpenDataDirectory}>
                    打开目录
                  </Button>
                </Col>
              </Row>
            </Space>

            <Divider />

            <Alert
              message="数据安全提醒"
              description="建议定期备份数据库文件，确保数据安全。备份文件存储在用户数据目录下的 backups 文件夹中。"
              type="info"
              showIcon
            />
          </Card>

          <Card title="系统信息" style={{ marginTop: 16 }}>
            <p>
              <strong>系统版本：</strong>1.0.0
            </p>
            <p>
              <strong>Electron版本：</strong>35.1.5
            </p>
            <p>
              <strong>React版本：</strong>19.1.0
            </p>
            <p>
              <strong>Ant Design版本：</strong>5.26.2
            </p>
            <p>
              <strong>数据库：</strong>SQLite
            </p>
            <p>
              <strong>构建工具：</strong>Vite
            </p>
          </Card>
        </Col>
      </Row>

      {/* 备份文件管理模态框 */}
      <Modal
        title="备份文件管理"
        open={backupModalVisible}
        onCancel={() => setBackupModalVisible(false)}
        footer={null}
        width={800}
      >
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleBackup}
              loading={backupLoading}
            >
              创建新备份
            </Button>
            <Button icon={<ReloadOutlined />} onClick={loadBackupFiles}>
              刷新列表
            </Button>
          </Space>
        </div>

        <Table
          columns={backupColumns}
          dataSource={backupFiles}
          rowKey="filePath"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个备份文件`
          }}
          locale={{
            emptyText: '暂无备份文件'
          }}
        />
      </Modal>
    </div>
  )
}

export default Settings
