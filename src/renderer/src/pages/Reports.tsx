import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Table, DatePicker, Button, Tabs, Progress } from 'antd'
import { UserOutlined, WalletOutlined, ShoppingOutlined, DownloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { toast } from '../components/Toast'

const { RangePicker } = DatePicker
const { TabPane } = Tabs

interface Statistics {
  memberStats: {
    total_members: number
    active_members: number
    total_balance: number
  }
  consumptionStats: {
    total_transactions: number
    total_consumption: number
  }
  rechargeStats: {
    total_recharges: number
    total_recharge_amount: number
  }
  serviceStats: Array<{
    name: string
    usage_count: number
    total_amount: number
  }>
}

interface Transaction {
  id: number
  member_name: string
  member_phone: string
  service_name: string
  amount: number
  transaction_type: string
  created_at: string
  remark: string
}

interface Recharge {
  id: number
  member_name: string
  member_phone: string
  amount: number
  payment_method: string
  operator: string
  created_at: string
  remark: string
}

const Reports: React.FC = () => {
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [recharges, setRecharges] = useState<Recharge[]>([])
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month')
  ])

  useEffect(() => {
    loadData()
  }, [dateRange])

  const loadData = async () => {
    try {
      setLoading(true)
      const [statsResult, transResult, rechargeResult] = await Promise.all([
        window.electronAPI.getStatistics({
          startDate: dateRange[0].format('YYYY-MM-DD'),
          endDate: dateRange[1].format('YYYY-MM-DD')
        }),
        window.electronAPI.getTransactions({
          startDate: dateRange[0].format('YYYY-MM-DD'),
          endDate: dateRange[1].format('YYYY-MM-DD')
        }),
        window.electronAPI.getRecharges({
          startDate: dateRange[0].format('YYYY-MM-DD'),
          endDate: dateRange[1].format('YYYY-MM-DD')
        })
      ])

      if (statsResult.success) {
        setStatistics(statsResult.data)
      }

      if (transResult.success) {
        setTransactions(transResult.data as Transaction[])
      }

      if (rechargeResult.success) {
        setRecharges(rechargeResult.data as Recharge[])
      }
    } catch (error) {
      toast.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDateRangeChange = (dates: any) => {
    if (dates) {
      setDateRange([dates[0], dates[1]])
    }
  }

  const handleExport = () => {
    toast.info('导出功能开发中...')
  }

  const transactionColumns = [
    {
      title: '会员姓名',
      dataIndex: 'member_name',
      key: 'member_name',
      width: 100
    },
    {
      title: '手机号',
      dataIndex: 'member_phone',
      key: 'member_phone',
      width: 120
    },
    {
      title: '服务项目',
      dataIndex: 'service_name',
      key: 'service_name',
      width: 120
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (amount: number) => `¥${amount.toFixed(2)}`
    },
    {
      title: '类型',
      dataIndex: 'transaction_type',
      key: 'transaction_type',
      width: 80,
      render: (type: string) => (
        <span style={{ color: type === '消费' ? '#ff4d4f' : '#52c41a' }}>{type}</span>
      )
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      ellipsis: true
    }
  ]

  const rechargeColumns = [
    {
      title: '会员姓名',
      dataIndex: 'member_name',
      key: 'member_name',
      width: 100
    },
    {
      title: '手机号',
      dataIndex: 'member_phone',
      key: 'member_phone',
      width: 120
    },
    {
      title: '充值金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (amount: number) => `¥${amount.toFixed(2)}`
    },
    {
      title: '支付方式',
      dataIndex: 'payment_method',
      key: 'payment_method',
      width: 100
    },
    {
      title: '操作员',
      dataIndex: 'operator',
      key: 'operator',
      width: 80
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')
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
      <h1>统计报表</h1>

      {/* 日期选择和导出 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <span style={{ marginRight: 8 }}>统计时间：</span>
            <RangePicker value={dateRange} onChange={handleDateRangeChange} format="YYYY-MM-DD" />
          </Col>
          <Col>
            <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
              导出报表
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 统计概览 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总会员数"
              value={statistics?.memberStats.total_members || 0}
              prefix={<UserOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="会员总余额"
              value={statistics?.memberStats.total_balance || 0}
              prefix={<WalletOutlined />}
              precision={2}
              suffix="元"
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="消费总额"
              value={statistics?.consumptionStats.total_consumption || 0}
              prefix={<ShoppingOutlined />}
              precision={2}
              suffix="元"
              valueStyle={{ color: '#cf1322' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="充值总额"
              value={statistics?.rechargeStats.total_recharge_amount || 0}
              prefix={<WalletOutlined />}
              precision={2}
              suffix="元"
              valueStyle={{ color: '#3f8600' }}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      {/* 详细报表 */}
      <Tabs defaultActiveKey="overview">
        <TabPane tab="统计概览" key="overview">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="交易统计" loading={loading}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title="消费次数"
                      value={statistics?.consumptionStats.total_transactions || 0}
                      prefix={<ShoppingOutlined />}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="充值次数"
                      value={statistics?.rechargeStats.total_recharges || 0}
                      prefix={<WalletOutlined />}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="服务项目统计" loading={loading}>
                {statistics?.serviceStats.map((service, index) => (
                  <div key={index} style={{ marginBottom: 16 }}>
                    <div
                      style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}
                    >
                      <span>{service.name}</span>
                      <span>¥{service.total_amount.toFixed(2)}</span>
                    </div>
                    <Progress
                      percent={
                        ((service.total_amount || 0) /
                          (statistics?.consumptionStats.total_consumption || 1)) *
                        100
                      }
                      size="small"
                      showInfo={false}
                    />
                  </div>
                ))}
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="消费记录" key="transactions">
          <Card>
            <Table
              columns={transactionColumns}
              dataSource={transactions}
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
        </TabPane>

        <TabPane tab="充值记录" key="recharges">
          <Card>
            <Table
              columns={rechargeColumns}
              dataSource={recharges}
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
        </TabPane>
      </Tabs>
    </div>
  )
}

export default Reports
