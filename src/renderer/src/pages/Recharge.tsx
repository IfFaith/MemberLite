import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Form, 
  Select, 
  InputNumber, 
  Button, 
  Row, 
  Col, 
  Descriptions,
  Alert,
  Input
} from 'antd'
import { WalletOutlined, UserOutlined } from '@ant-design/icons'
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

// interface RechargeRecord {
//   id: number
//   member_name: string
//   member_phone: string
//   amount: number
//   payment_method: string
//   operator: string
//   created_at: string
//   remark: string
// }

const Recharge: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([])
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  // const [rechargeRecords, setRechargeRecords] = useState<RechargeRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    loadMembers()
    // loadRechargeRecords()
  }, [])

  const loadMembers = async () => {
    try {
      const result = await window.electronAPI.getMembers()
      if (result.success && result.data) {
        setMembers(result.data.filter((m: Member) => m.status === '正常'))
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

  // const loadRechargeRecords = async () => {
  //   try {
  //     const result = await window.electronAPI.getRecharges()
  //     if (result.success && result.data) {
  //       setRechargeRecords(result.data)
  //     } else {
  //       toast.error('加载充值记录失败')
  //     }
  //   } catch (error) {
  //     console.error('加载充值记录失败:', error)
  //     toast.error('加载充值记录失败')
  //   }
  // }

  const handleMemberChange = (memberId: number) => {
    const member = members.find(m => m.id === memberId)
    setSelectedMember(member || null)
    form.setFieldsValue({ amount: undefined })
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      
      if (!selectedMember) {
        toast.error('请选择会员')
        return
      }

      if (values.amount <= 0) {
        toast.error('充值金额必须大于0')
        return
      }

      setLoading(true)
      const result = await window.electronAPI.createRecharge({
        memberId: selectedMember.id,
        amount: values.amount,
        paymentMethod: values.paymentMethod || '现金',
        operator: values.operator || '系统',
        remark: values.remark || ''
      })

      if (result.success) {
        toast.success('充值成功')
        form.resetFields()
        setSelectedMember(null)
        loadMembers() // 重新加载数据以更新余额
        // loadRechargeRecords() // 重新加载充值记录
      } else {
        toast.error(result.error || '充值失败')
      }
    } catch (error) {
      console.error('充值失败:', error)
      toast.error('充值失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      <h1>会员充值</h1>
      
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title="充值信息" loading={loading}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                paymentMethod: '现金',
                operator: '系统'
              }}
            >
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
                  {members.map(member => (
                    <Option key={member.id} value={member.id}>
                      {member.name} ({member.phone}) - 余额: ¥{member.balance.toFixed(2)}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="amount"
                label="充值金额"
                rules={[
                  { required: true, message: '请输入充值金额' },
                  { type: 'number', min: 0.01, message: '充值金额必须大于0' }
                ]}
              >
                <InputNumber
                  placeholder="请输入充值金额"
                  min={0.01}
                  precision={2}
                  style={{ width: '100%' }}
                  addonAfter="元"
                />
              </Form.Item>

              <Form.Item
                name="paymentMethod"
                label="支付方式"
                rules={[{ required: true, message: '请选择支付方式' }]}
              >
                <Select placeholder="请选择支付方式">
                  <Option value="现金">现金</Option>
                  <Option value="微信">微信</Option>
                  <Option value="支付宝">支付宝</Option>
                  <Option value="银行卡">银行卡</Option>
                  <Option value="其他">其他</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="operator"
                label="操作员"
                rules={[{ required: true, message: '请输入操作员' }]}
              >
                <Select placeholder="请选择操作员">
                  <Option value="系统">系统</Option>
                  <Option value="张三">张三</Option>
                  <Option value="李四">李四</Option>
                  <Option value="王五">王五</Option>
                </Select>
              </Form.Item>

              <Form.Item name="remark" label="备注">
                <Input.TextArea rows={3} placeholder="请输入备注信息" />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  icon={<WalletOutlined />}
                  loading={loading}
                  disabled={!selectedMember}
                  block
                >
                  确认充值
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

          {selectedMember && (
            <Card title="充值预览" style={{ marginTop: 16 }}>
              <Alert
                message="充值信息确认"
                description={
                  <div>
                    <p>会员：{selectedMember.name}</p>
                    <p>当前余额：¥{selectedMember.balance.toFixed(2)}</p>
                    <p>充值后余额：¥{(selectedMember.balance + (form.getFieldValue('amount') || 0)).toFixed(2)}</p>
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

export default Recharge 