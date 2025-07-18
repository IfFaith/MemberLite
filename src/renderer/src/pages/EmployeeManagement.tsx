import React, { useEffect, useState } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Popconfirm,
  message,
  Space,
  Tag,
  InputNumber
} from 'antd'
import dayjs from 'dayjs'

const statusOptions = [
  { label: '在职', value: '在职' },
  { label: '离职', value: '离职' }
]

const EmployeeManagement: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<any>(null)
  const [form] = Form.useForm()

  // 获取员工列表
  const fetchEmployees = async () => {
    setLoading(true)
    const result = await window.electronAPI.getEmployees()
    if (result.success && result.data) {
      setEmployees(result.data)
    } else {
      message.error('加载员工列表失败: ' + (result.error || '未知错误'))
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  // 新增/编辑员工
  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      let result
      if (editingEmployee) {
        result = await window.electronAPI.updateEmployee(editingEmployee.id, {
          ...values,
          entry_date: values.entry_date ? values.entry_date.format('YYYY-MM-DD') : null
        })
      } else {
        result = await window.electronAPI.addEmployee({
          ...values,
          entry_date: values.entry_date ? values.entry_date.format('YYYY-MM-DD') : null
        })
      }

      if (result.success) {
        message.success(editingEmployee ? '员工信息已更新' : '员工已添加')
        setModalVisible(false)
        form.resetFields()
        setEditingEmployee(null)
        fetchEmployees()
      } else {
        message.error(result.error || '操作失败')
      }
    } catch (e) {
      // 捕获表单验证错误
    }
  }

  // 删除员工
  const handleDelete = async (id: number) => {
    const result = await window.electronAPI.deleteEmployee(id)
    if ((result as any).success) {
      message.success('员工已删除')
      fetchEmployees()
    } else {
      message.error((result as any).error || '删除失败')
    }
  }

  // 打开编辑弹窗
  const openEditModal = (record: any) => {
    setEditingEmployee(record)
    setModalVisible(true)
    form.setFieldsValue({
      ...record,
      entry_date: record.entry_date ? dayjs(record.entry_date) : null
    })
  }

  // 打开新增弹窗
  const openAddModal = () => {
    setEditingEmployee(null)
    setModalVisible(true)
    form.resetFields()
    form.setFieldsValue({ status: '在职' })
  }

  const columns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (text: string) =>
        text === '在职' ? <Tag color="green">在职</Tag> : <Tag color="red">离职</Tag>
    },
    { title: '手机号', dataIndex: 'phone', key: 'phone' },
    {
      title: '入职日期',
      dataIndex: 'entry_date',
      key: 'entry_date',
      render: (text: string) => (text ? dayjs(text).format('YYYY-MM-DD') : '-')
    },
    {
      title: '充值提成(%)',
      dataIndex: 'recharge_commission',
      key: 'recharge_commission',
      render: (value: number) => `${value || 0}%`
    },
    { title: '备注', dataIndex: 'remark', key: 'remark' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" onClick={() => openEditModal(record)}>
            编辑
          </Button>
          <Popconfirm title="确定要删除该员工吗？" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div className="page-container" style={{ padding: 24 }}>
      <h1>员工管理</h1>
      <Button type="primary" onClick={openAddModal} style={{ marginBottom: 16 }}>
        新增员工
      </Button>
      <Table rowKey="id" columns={columns} dataSource={employees} loading={loading} bordered />
      <Modal
        title={editingEmployee ? '编辑员工' : '新增员工'}
        open={modalVisible}
        onOk={handleOk}
        onCancel={() => {
          setModalVisible(false)
          setEditingEmployee(null)
        }}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input />
          </Form.Item>
          <Form.Item name="entry_date" label="入职日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="recharge_commission"
            label="充值提成比例(%)"
            rules={[{ type: 'number', min: 0, max: 100, message: '请输入0-100的数字' }]}
          >
            <InputNumber style={{ width: '100%' }} addonAfter="%" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Select options={statusOptions} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default EmployeeManagement
