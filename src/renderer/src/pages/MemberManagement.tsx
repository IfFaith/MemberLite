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
  Tag
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  AlipayCircleOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { toast } from '../components/Toast'

const { Option } = Select

interface Member {
  id: number
  name: string
  phone: string
  level: string
  balance: number
  status: string
  register_date: string
  remark: string
  created_at: string
  updated_at: string
}

interface Consumption {
  amount: number // 本次消费
  balance_after: number // 消费前
  balance_before: number // 消费后
  created_at: string //消费时间
  id: number // 消费id
  member_id: number //会员id
  member_name: string // 会员名称
  remark: string // 备注
  service_id: number // 服务id
  service_name: string // 服务名称
  transaction_type: string //交易类型
}

const MemberManagement: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([])
  const [consumptions, setConsumptions] = useState<Consumption[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingConsumption, setLoadingConsumption] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [consumptionModalVisible, setConsumptionModalVisible] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [form] = Form.useForm()
  const [searchForm] = Form.useForm()

  useEffect(() => {
    loadMembers() 
  }, [])

  const loadMembers = async () => {
    try {
      setLoading(true)
      // 直接调用getMembers，不使用搜索表单
      const result = await window.electronAPI.getMembers()
      console.log(result)
      if (result.success && result.data) {
        setMembers(result.data as Member[])
      } else {
        toast.error('加载会员数据失败')
      }
    } catch (error) {
      console.error('加载会员失败:', error)
      toast.error('加载会员数据失败')
    } finally {
      setLoading(false)
    }
  }

  const getMemberTransactions = async (item) => {
    try {
      setLoadingConsumption(true)
      const id = item.id
      if (!id && id !== 0) return
      setConsumptionModalVisible(true)

      const result = await window.electronAPI.getMemberTransactions(id)
      if (result.success) {
        console.log(result.data)
        setConsumptions(result.data as Consumption[])
      } else {
        toast.error('加载会员消费记录失败')
      }
    } catch (error) {
      console.error('加载消费记录失败:', error)
      toast.error('加载会员消费记录失败')
    } finally {
      setLoadingConsumption(false)
    }
  }

  const handleAdd = () => {
    setEditingMember(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: Member) => {
    setEditingMember(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      const result = await window.electronAPI.deleteMember(id)
      if (result.success) {
        toast.success('删除成功')
        loadMembers()
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

      if (editingMember) {
        // 更新会员
        const result = await window.electronAPI.updateMember(editingMember.id, values)
        if (result.success) {
          toast.success('更新成功')
          setModalVisible(false)
          setEditingMember(null)
          form.resetFields()
          loadMembers()
        } else {
          toast.error(result.error || '更新失败')
        }
      } else {
        // 添加会员
        const result = await window.electronAPI.addMember(values)
        if (result.success) {
          toast.success('添加成功')
          setModalVisible(false)
          form.resetFields()
          loadMembers()
        } else {
          toast.error(result.error || '添加失败')
        }
      }
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  const handleSearch = async () => {
    try {
      const values = await searchForm.validateFields()
      setLoading(true)

      // 使用搜索表单的值进行搜索
      const result = await window.electronAPI.getMembersBySearchform(values)
      if (result.success && result.data) {
        setMembers(result.data as Member[])
      } else {
        toast.error('搜索失败')
      }
    } catch (error) {
      console.error('搜索失败:', error)
      toast.error('搜索失败')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 120
    },
    {
      title: '会员等级',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level: string) => {
        const colorMap: { [key: string]: string } = {
          普通会员: 'blue',
          VIP会员: 'green',
          钻石会员: 'purple'
        }
        return <Tag color={colorMap[level] || 'default'}>{level}</Tag>
      }
    },
    {
      title: '余额',
      dataIndex: 'balance',
      key: 'balance',
      width: 100,
      render: (balance: number) => `¥${balance.toFixed(2)}`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 70,
      render: (status: string) => {
        const colorMap: { [key: string]: string } = {
          正常: 'green',
          暂停: 'orange',
          注销: 'red'
        }
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>
      }
    },
    {
      title: '注册日期',
      dataIndex: 'register_date',
      key: 'register_date',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD')
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      ellipsis: true
    },
    {
      title: '操作',
      key: 'action',
      width: 300,
      render: (_, record: Member) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button
            type="link"
            icon={<AlipayCircleOutlined />}
            onClick={() => getMemberTransactions(record)}
          >
            消费记录
          </Button>
          <Popconfirm
            title="确定要删除这个会员吗？"
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
  const columnsConsumption = [
    {
      title: '姓名',
      dataIndex: 'member_name',
      key: 'member_name',
      width: 100
    },
    {
      title: '交易类型',
      dataIndex: 'transaction_type',
      key: 'transaction_type',
      width: 100
    },
    {
      title: '消费前余额',
      dataIndex: 'balance_before',
      key: 'balance_before',
      width: 120,
      render: (balance: number) => `¥${balance.toFixed(2)}`
    },
    {
      title: '变动金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (balance: number) => `¥${balance.toFixed(2)}`
    },
    {
      title: '消费后余额',
      dataIndex: 'balance_after',
      key: 'balance_after',
      width: 120,
      className:'balance-after',
      render: (balance: number) => `¥${balance.toFixed(2)}`
    },
    {
      title: '消费时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180
    },
    {
      title: '服务类型',
      dataIndex: 'service_name',
      key: 'service_name',
      width: 120
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      ellipsis: true
    }
  ]

  return (
    <div className="page-container">
      <h1>会员管理</h1>

      {/* 搜索区域 */}
      <Card className="search-area">
        <Form form={searchForm} layout="inline">
          <Form.Item name="name" label="姓名">
            <Input placeholder="请输入姓名" allowClear style={{ width: 110 }} />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input placeholder="请输入手机号" allowClear style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="level" label="会员等级">
            <Select placeholder="请选择等级" allowClear style={{ width: 120 }}>
              <Option value="普通会员">普通会员</Option>
              <Option value="VIP会员">VIP会员</Option>
              <Option value="钻石会员">钻石会员</Option>
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择状态" allowClear style={{ width: 100 }}>
              <Option value="正常">正常</Option>
              <Option value="暂停">暂停</Option>
              <Option value="注销">注销</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              搜索
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* 操作按钮 */}
      <div className="button-group">
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增会员
        </Button>
      </div>

      {/* 会员列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={members}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            pageSize: 10,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* 新增/编辑模态框 */}
      <Modal
        title={editingMember ? '编辑会员' : '新增会员'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            level: '普通会员',
            status: '正常',
            balance: 0
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="姓名"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="手机号"
                rules={[
                  { required: true, message: '请输入手机号' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
                ]}
              >
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="level"
                label="会员等级"
                rules={[{ required: true, message: '请选择会员等级' }]}
              >
                <Select placeholder="请选择会员等级">
                  <Option value="普通会员">普通会员</Option>
                  <Option value="VIP会员">VIP会员</Option>
                  <Option value="钻石会员">钻石会员</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select placeholder="请选择状态">
                  <Option value="正常">正常</Option>
                  <Option value="暂停">暂停</Option>
                  <Option value="注销">注销</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          {!editingMember && (
            <Form.Item
              name="balance"
              label="初始余额"
              rules={[{ required: true, message: '请输入初始余额' }]}
            >
              <Input type="number" placeholder="请输入初始余额" addonAfter="元" />
            </Form.Item>
          )}
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title={'消费记录'}
        open={consumptionModalVisible}
        onOk={handleSubmit}
        onCancel={() => setConsumptionModalVisible(false)}
        width={800}
        destroyOnClose
      >
        <Table
          columns={columnsConsumption}
          dataSource={consumptions}
          rowKey="id"
          loading={loadingConsumption}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            pageSize: 10,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          scroll={{ x: 1000 }}
        />
      </Modal>
    </div>
  )
}

export default MemberManagement
