import React, { useState, useEffect } from 'react'
import { Card, Form, Select, InputNumber, Button, Row, Col, Descriptions, Alert, Input } from 'antd'
import { ShoppingOutlined, UserOutlined } from '@ant-design/icons'
import { toast } from '../components/Toast'

const { Option } = Select

interface Member {
  id: number
  name: string
  phone: string
  level: string
  balance: number
  status: string
}

interface Service {
  id: number
  name: string
  category: string
  price: number
  vip_price: number
  diamond_price: number
  status: string
}

// interface Transaction {
//   id: number
//   member_name: string
//   member_phone: string
//   service_name: string
//   amount: number
//   transaction_type: string
//   created_at: string
//   remark: string
// }

const Consumption: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [membersResult, servicesResult] = await Promise.all([
        window.electronAPI.getMembers(),
        window.electronAPI.getServices(),
      ])

      if (membersResult.success && membersResult.data) {
        setMembers(membersResult.data.filter((m: Member) => m.status === '正常'))
      }

      if (servicesResult.success && servicesResult.data) {
        setServices(servicesResult.data.filter((s: Service) => s.status === '启用'))
      }
    } catch (error) {
      console.error('加载数据失败:', error)
      toast.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleMemberChange = (memberId: number) => {
    const member = members.find((m) => m.id === memberId)
    setSelectedMember(member || null)
    form.setFieldsValue({ serviceId: undefined, amount: undefined })
    setSelectedService(null)
  }

  const handleServiceChange = (serviceId: number) => {
    const service = services.find((s) => s.id === serviceId)
    setSelectedService(service || null)

    if (service && selectedMember) {
      let price = service.price
      if (selectedMember.level === 'VIP会员' && service.vip_price) {
        price = service.vip_price
      } else if (selectedMember.level === '钻石会员' && service.diamond_price) {
        price = service.diamond_price
      }

      form.setFieldsValue({ amount: price })
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      if (!selectedMember || !selectedService) {
        toast.error('请选择会员和服务项目')
        return
      }

      const price = calculatePrice()
      if (selectedMember.balance < price) {
        toast.error('会员余额不足')
        return
      }

      setLoading(true)
      const result = await window.electronAPI.createTransaction({
        memberId: selectedMember.id,
        serviceId: selectedService.id,
        amount: price,
        remark: values.remark || ''
      })

      if (result.success) {
        toast.success('消费扣费成功')
        form.resetFields()
        setSelectedMember(null)
        setSelectedService(null)
        loadData() // 重新加载数据以更新余额和交易记录
      } else {
        toast.error(result.error || '消费扣费失败')
      }
    } catch (error) {
      console.error('消费扣费失败:', error)
      toast.error('消费扣费失败')
    } finally {
      setLoading(false)
    }
  }

  const getServicePrice = () => {
    if (!selectedService || !selectedMember) return 0

    let price = selectedService.price
    if (selectedMember.level === 'VIP会员' && selectedService.vip_price) {
      price = selectedService.vip_price
    } else if (selectedMember.level === '钻石会员' && selectedService.diamond_price) {
      price = selectedService.diamond_price
    }

    return price
  }

  const calculatePrice = () => {
    if (!selectedMember || !selectedService) return 0

    switch (selectedMember.level) {
      case 'VIP会员':
        return selectedService.vip_price || selectedService.price
      case '钻石会员':
        return selectedService.diamond_price || selectedService.price
      default:
        return selectedService.price
    }
  }

  return (
    <div className="page-container">
      <h1>消费扣费</h1>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title="消费信息" loading={loading}>
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item
                name="memberId"
                label="选择会员"
                rules={[{ required: true, message: '请选择会员' }]}
              >
                <Select
                  placeholder="请选择会员"
                  showSearch
                  optionFilterProp="children"
                  onChange={handleMemberChange}
                  loading={loading}
                >
                  {members.map((member) => (
                    <Option key={member.id} value={member.id}>
                      {member.name} ({member.phone}) - 余额: ¥{member.balance.toFixed(2)}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="serviceId"
                label="选择服务项目"
                rules={[{ required: true, message: '请选择服务项目' }]}
              >
                <Select
                  placeholder="请选择服务项目"
                  showSearch
                  optionFilterProp="children"
                  onChange={handleServiceChange}
                  disabled={!selectedMember}
                >
                  {services.map((service) => (
                    <Option key={service.id} value={service.id}>
                      {service.name} - ¥{service.price.toFixed(2)}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="amount"
                label="消费金额"
                rules={[{ required: true, message: '请输入消费金额' }]}
              >
                <InputNumber
                  placeholder="请输入消费金额"
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                  addonAfter="元"
                  disabled={!selectedService}
                />
              </Form.Item>

              <Form.Item name="remark" label="备注">
                <Input.TextArea rows={3} placeholder="请输入备注信息" />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<ShoppingOutlined />}
                  loading={loading}
                  disabled={!selectedMember || !selectedService}
                  block
                >
                  确认扣费
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="会员信息" loading={loading}>
            {selectedMember ? (
              <Descriptions column={1} bordered>
                <Descriptions.Item label="姓名">{selectedMember.name}</Descriptions.Item>
                <Descriptions.Item label="手机号">{selectedMember.phone}</Descriptions.Item>
                <Descriptions.Item label="会员等级">{selectedMember.level}</Descriptions.Item>
                <Descriptions.Item label="当前余额">
                  <span style={{ color: selectedMember.balance > 0 ? '#52c41a' : '#ff4d4f' }}>
                    ¥{selectedMember.balance.toFixed(2)}
                  </span>
                </Descriptions.Item>
              </Descriptions>
            ) : (
              <div style={{ textAlign: 'center', color: '#999', padding: '40px 0' }}>
                <UserOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <p>请先选择会员</p>
              </div>
            )}
          </Card>

          {selectedService && (
            <Card title="服务信息" style={{ marginTop: 16 }}>
              <Descriptions column={1} bordered>
                <Descriptions.Item label="服务名称">{selectedService.name}</Descriptions.Item>
                <Descriptions.Item label="服务分类">{selectedService.category}</Descriptions.Item>
                <Descriptions.Item label="普通价格">
                  ¥{selectedService.price.toFixed(2)}
                </Descriptions.Item>
                {selectedService.vip_price && (
                  <Descriptions.Item label="VIP价格">
                    ¥{selectedService.vip_price.toFixed(2)}
                  </Descriptions.Item>
                )}
                {selectedService.diamond_price && (
                  <Descriptions.Item label="钻石价格">
                    ¥{selectedService.diamond_price.toFixed(2)}
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="适用价格">
                  <span style={{ color: '#1890ff', fontWeight: 'bold' }}>
                    ¥{getServicePrice().toFixed(2)}
                  </span>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          {selectedMember && selectedService && (
            <Card title="扣费预览" style={{ marginTop: 16 }}>
              <Alert
                message="扣费信息确认"
                description={
                  <div>
                    <p>会员：{selectedMember.name}</p>
                    <p>服务：{selectedService.name}</p>
                    <p>金额：¥{getServicePrice().toFixed(2)}</p>
                    <p>扣费后余额：¥{(selectedMember.balance - getServicePrice()).toFixed(2)}</p>
                  </div>
                }
                type="info"
                showIcon
              />
            </Card>
          )}
        </Col>
      </Row>
    </div>
  )
}

export default Consumption
