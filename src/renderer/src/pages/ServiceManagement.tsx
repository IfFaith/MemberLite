import React, { useState, useEffect } from 'react'
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Space, 
  Popconfirm,
  Card,
  Row,
  Col,
  Tag,
  InputNumber,
  Tabs,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { toast } from '../components/Toast'

const { Option } = Select

interface Service {
  id: number
  name: string
  category: string
  price: number
  vip_price: number
  diamond_price: number
  status: string
  created_at: string
  updated_at: string
}

const ServiceManagement: React.FC = () => {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [form] = Form.useForm()
  const [activeTab, setActiveTab] = useState('base')
  const [employeeCommissions, setEmployeeCommissions] = useState<any[]>([])
  const [commissionLoading, setCommissionLoading] = useState(false)

  useEffect(() => {
    loadServices()
  }, [])

  useEffect(() => {
    if (modalVisible && editingService) {
      fetchCommissions(editingService.id)
    }
  }, [modalVisible, editingService])

  const loadServices = async () => {
    try {
      setLoading(true)
      const result = await window.electronAPI.getServices()
      if (result.success && result.data) {
        setServices(result.data)
      } else {
        toast.error('加载服务项目数据失败')
      }
    } catch (error) {
      console.error('加载服务项目失败:', error)
      toast.error('加载服务项目数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    setEditingService(null)
    form.resetFields()
    setModalVisible(true)
    setActiveTab('base')
    // 新增时加载所有员工，提成比例为0
    const result = await window.electronAPI.getEmployees()
    const employees = result && result.success && result.data ? result.data : []
    setEmployeeCommissions(
      employees.map((emp: any) => ({
        employee_id: emp.id,
        name: emp.name,
        phone: emp.phone,
        commission: 0
      }))
    )
  }

  const handleEdit = (record: Service) => {
    setEditingService(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      const result = await window.electronAPI.deleteService(id)
      if (result.success) {
        toast.success('删除成功')
        loadServices()
      } else {
        toast.error(result.error || '删除失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      toast.error('删除失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      // 只保留需要的字段，转换日期为字符串（如有）
      const submitValues = { ...values }
      // 如果有日期字段，转为字符串
      if (editingService) {
        // 更新服务项目
        const result = await window.electronAPI.updateService(editingService.id, submitValues)
        if (result.success) {
          toast.success('更新成功')
          setModalVisible(false)
          setEditingService(null)
          form.resetFields()
          loadServices()
        } else {
          toast.error(result.error || '更新失败')
        }
      } else {
        // 添加服务项目
        const result = await window.electronAPI.addService(submitValues)
        if (result.success) {
          toast.success('添加成功')
          setModalVisible(false)
          form.resetFields()
          loadServices()
        } else {
          toast.error(result.error || '添加失败')
        }
      }
    } catch (error) {
      console.error('操作失败:', error)
    }
  }

  const fetchCommissions = async (projectId: number) => {
    setCommissionLoading(true)
    const res = await window.electronAPI.getProjectCommissions(projectId)
    setEmployeeCommissions((res.data || []) as any)
    setCommissionLoading(false)
  }

  const handleCommissionChange = (idx: number, value: number) => {
    setEmployeeCommissions(prev => {
      const arr = [...prev]
      arr[idx] = { ...arr[idx], commission: value }
      return arr
    })
  }

  const saveCommissions = async () => {
    if (!editingService) return
    for (const emp of employeeCommissions) {
      await window.electronAPI.setProjectCommission({
        project_id: editingService.id,
        employee_id: emp.employee_id,
        commission: emp.commission || 0
      })
    }
    toast.success('员工提成设置已保存')
    fetchCommissions(editingService.id)
  }

  const columns = [
    {
      title: '服务名称',
      dataIndex: 'name',
      key: 'name',
      width: 150
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100
    },
    {
      title: '普通价格',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (price: number) => `¥${price.toFixed(2)}`
    },
    {
      title: 'VIP价格',
      dataIndex: 'vip_price',
      key: 'vip_price',
      width: 100,
      render: (price: number) => price ? `¥${price.toFixed(2)}` : '-'
    },
    {
      title: '钻石价格',
      dataIndex: 'diamond_price',
      key: 'diamond_price',
      width: 100,
      render: (price: number) => price ? `¥${price.toFixed(2)}` : '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={status === '启用' ? 'green' : 'red'}>{status}</Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record: Service) => (
        <Space>
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个服务项目吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div className="page-container">
      <h1>服务项目管理</h1>
      
      {/* 操作按钮 */}
      <div className="button-group">
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增服务项目
        </Button>
      </div>

      {/* 服务项目列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={services}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            pageSize: 10,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* 新增/编辑模态框 */}
      <Modal
        title={editingService ? '编辑服务项目' : '新增服务项目'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
        destroyOnHidden
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.TabPane tab="基本信息" key="base">
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                status: '启用'
              }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="name"
                    label="服务名称"
                    rules={[{ required: true, message: '请输入服务名称' }]}
                  >
                    <Input placeholder="请输入服务名称" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="category"
                    label="服务分类"
                    rules={[{ required: true, message: '请输入服务分类' }]}
                  >
                    <Select placeholder="请选择服务分类">
                      <Option value="剪发">剪发</Option>
                      <Option value="染发">染发</Option>
                      <Option value="烫发">烫发</Option>
                      <Option value="护理">护理</Option>
                      <Option value="造型">造型</Option>
                      <Option value="其他">其他</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="price"
                    label="普通价格"
                    rules={[{ required: true, message: '请输入普通价格' }]}
                  >
                    <InputNumber
                      placeholder="请输入价格"
                      min={0}
                      precision={2}
                      style={{ width: '100%' }}
                      addonAfter="元"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="vip_price"
                    label="VIP价格"
                  >
                    <InputNumber
                      placeholder="请输入价格"
                      min={0}
                      precision={2}
                      style={{ width: '100%' }}
                      addonAfter="元"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="diamond_price"
                    label="钻石价格"
                  >
                    <InputNumber
                      placeholder="请输入价格"
                      min={0}
                      precision={2}
                      style={{ width: '100%' }}
                      addonAfter="元"
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select placeholder="请选择状态">
                  <Option value="启用">启用</Option>
                  <Option value="禁用">禁用</Option>
                </Select>
              </Form.Item>
            </Form>
          </Tabs.TabPane>
          <Tabs.TabPane tab="员工提成" key="commission">
            <Table
              rowKey="employee_id"
              columns={[
                { title: '姓名', dataIndex: 'name' },
                { title: '手机号', dataIndex: 'phone' },
                {
                  title: '提成比例(%)',
                  dataIndex: 'commission',
                  render: (value, _record, idx) => (
                    
                    <InputNumber
                      min={0}
                      max={100}
                      value={value}
                      onChange={val => handleCommissionChange(idx, val as number)}
                      style={{ width: 100 }}
                    />
                  )
                }
              ]}
              dataSource={employeeCommissions}
              loading={commissionLoading}
              pagination={false}
            />
            <Button type="primary" onClick={saveCommissions} style={{ marginTop: 16 }}>保存提成设置</Button>
          </Tabs.TabPane>
        </Tabs>
      </Modal>
    </div>
  )
}

export default ServiceManagement 