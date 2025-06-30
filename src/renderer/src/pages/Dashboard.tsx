import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Table, Progress } from 'antd'
import { UserOutlined, WalletOutlined, ShoppingOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

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

const Dashboard: React.FC = () => {
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('Dashboard component mounted')
    loadStatistics()
  }, [])

  const loadStatistics = async () => {
    try {
      console.log('Loading statistics...')
      setLoading(true)
      const result = await window.electronAPI.getStatistics({
        startDate: dayjs().startOf('month').format('YYYY-MM-DD'),
        endDate: dayjs().endOf('month').format('YYYY-MM-DD')
      })
      
      console.log('Statistics result:', result)
      if (result.success) {
        setStatistics(result.data)
      }
    } catch (error) {
      console.error('加载统计数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const serviceColumns = [
    {
      title: '服务项目',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '使用次数',
      dataIndex: 'usage_count',
      key: 'usage_count',
      render: (count: number) => count || 0
    },
    {
      title: '总收入',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount: number) => `¥${(amount || 0).toFixed(2)}`
    },
    {
      title: '占比',
      key: 'percentage',
      render: (_, record: any) => {
        const total = statistics?.consumptionStats.total_consumption || 1
        const percentage = ((record.total_amount || 0) / total) * 100
        return <Progress percent={percentage} size="small" />
      }
    }
  ]

  return (
    <div className="page-container">
      <p>欢迎使用貔貅会员消费管理系统</p>
      
      {/* 统计卡片 */}
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
              title="活跃会员"
              value={statistics?.memberStats.active_members || 0}
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
              title="本月消费"
              value={statistics?.consumptionStats.total_consumption || 0}
              prefix={<ShoppingOutlined />}
              precision={2}
              suffix="元"
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      {/* 本月统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="本月交易统计" loading={loading}>
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
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Statistic
                  title="消费金额"
                  value={statistics?.consumptionStats.total_consumption || 0}
                  precision={2}
                  suffix="元"
                  valueStyle={{ color: '#cf1322' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="充值金额"
                  value={statistics?.rechargeStats.total_recharge_amount || 0}
                  precision={2}
                  suffix="元"
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="系统信息" loading={loading}>
            <p><strong>系统版本：</strong>1.0.0</p>
            <p><strong>数据库状态：</strong>正常</p>
            <p><strong>当前时间：</strong>{dayjs().format('YYYY-MM-DD HH:mm:ss')}</p>
            <p><strong>运行环境：</strong>Electron</p>
          </Card>
        </Col>
      </Row>

      {/* 服务项目统计 */}
      <Card title="本月服务项目统计" loading={loading}>
        <Table
          columns={serviceColumns}
          dataSource={statistics?.serviceStats || []}
          rowKey="name"
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  )
}

export default Dashboard 