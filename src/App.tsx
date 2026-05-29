import { useEffect, useMemo, useRef, useState } from 'react'
import AppLayout from '@cloudscape-design/components/app-layout'
import ContentLayout from '@cloudscape-design/components/content-layout'
import Header from '@cloudscape-design/components/header'
import Container from '@cloudscape-design/components/container'
import SpaceBetween from '@cloudscape-design/components/space-between'
import Box from '@cloudscape-design/components/box'
import Grid from '@cloudscape-design/components/grid'
import Spinner from '@cloudscape-design/components/spinner'
import Select from '@cloudscape-design/components/select'
import type { SelectProps } from '@cloudscape-design/components/select'
import Table from '@cloudscape-design/components/table'
import Pagination from '@cloudscape-design/components/pagination'
import Toggle from '@cloudscape-design/components/toggle'
import Button from '@cloudscape-design/components/button'
import Flashbar from '@cloudscape-design/components/flashbar'
import type { FlashbarProps } from '@cloudscape-design/components/flashbar'
import SideNavigation from '@cloudscape-design/components/side-navigation'
import BreadcrumbGroup from '@cloudscape-design/components/breadcrumb-group'
import { applyMode, Mode } from '@cloudscape-design/global-styles'
import TeamPage from './pages/TeamPage'
import NoticePage from './pages/NoticePage'
import MeetingMinutesPage from './pages/MeetingMinutesPage'
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts'

interface SalesRow {
  month: string
  product: string
  revenue: number
  customers: number
  region: string
  growthRate: number
}

function parseCSV(text: string): SalesRow[] {
  const lines = text.trim().split('\n')
  return lines.slice(1).map((line) => {
    const [month, product, revenue, customers, region, growthRate] = line.split(',')
    return {
      month,
      product,
      revenue: Number(revenue),
      customers: Number(customers),
      region,
      growthRate: Number(growthRate),
    }
  })
}

const EXPECTED_HEADERS = ['월', '제품명', '매출액(만원)', '고객수', '지역', '성장률(%)']

function validateCSV(text: string): { valid: boolean; error?: string } {
  const lines = text.trim().split('\n')
  if (lines.length < 2) {
    return { valid: false, error: 'CSV 파일에 데이터가 없습니다. 헤더와 최소 1개의 데이터 행이 필요합니다.' }
  }
  const headers = lines[0].split(',').map((h) => h.trim())
  const missingHeaders = EXPECTED_HEADERS.filter((h) => !headers.includes(h))
  if (missingHeaders.length > 0) {
    return { valid: false, error: `CSV 헤더가 올바르지 않습니다. 누락된 열: ${missingHeaders.join(', ')}` }
  }
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',')
    if (cols.length !== 6) {
      return { valid: false, error: `${i + 1}번째 행의 열 수가 올바르지 않습니다. (기대: 6개, 실제: ${cols.length}개)` }
    }
    if (isNaN(Number(cols[2])) || isNaN(Number(cols[3])) || isNaN(Number(cols[5]))) {
      return { valid: false, error: `${i + 1}번째 행에 숫자가 아닌 값이 포함되어 있습니다.` }
    }
  }
  return { valid: true }
}

const PIE_COLORS_LIGHT = ['#0972d3', '#44b9d6', '#7d8998', '#e07941', '#69ae34']
const PIE_COLORS_DARK = ['#539fe5', '#89d2dc', '#a4b0be', '#eb8f6a', '#8cc665']
const MONTH_ORDER = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [data, setData] = useState<SalesRow[]>([])
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [flashMessages, setFlashMessages] = useState<FlashbarProps.MessageDefinition[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedMonth, setSelectedMonth] = useState<SelectProps.Option | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<SelectProps.Option | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortingColumn, setSortingColumn] = useState<{ sortingField: string }>({ sortingField: 'revenue' })
  const [sortingDescending, setSortingDescending] = useState(true)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      setFlashMessages([{
        type: 'error',
        content: 'CSV 파일만 업로드할 수 있습니다.',
        dismissible: true,
        onDismiss: () => setFlashMessages([]),
      }])
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const validation = validateCSV(text)
      if (!validation.valid) {
        setFlashMessages([{
          type: 'error',
          content: validation.error!,
          dismissible: true,
          onDismiss: () => setFlashMessages([]),
        }])
        return
      }
      setData(parseCSV(text))
      setSelectedMonth(null)
      setSelectedRegion(null)
      setCurrentPage(1)
      setFlashMessages([{
        type: 'success',
        content: `"${file.name}" 파일이 성공적으로 로드되었습니다. (${parseCSV(text).length}개 행)`,
        dismissible: true,
        onDismiss: () => setFlashMessages([]),
      }])
    }
    reader.readAsText(file)
    // 같은 파일 재선택 가능하도록 초기화
    event.target.value = ''
  }

  useEffect(() => {
    applyMode(darkMode ? Mode.Dark : Mode.Light)
  }, [darkMode])

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + 'data-2025.csv')
      .then((res) => res.text())
      .then((text) => {
        setData(parseCSV(text))
        setLoading(false)
      })
  }, [])

  // 차트 색상 (다크/라이트 모드)
  const chartColors = useMemo(() => ({
    primary: darkMode ? '#539fe5' : '#0972d3',
    grid: darkMode ? '#414d5c' : '#e9ebed',
    text: darkMode ? '#d1d5db' : '#414d5c',
    tooltipBg: darkMode ? '#1a2332' : '#ffffff',
    pieColors: darkMode ? PIE_COLORS_DARK : PIE_COLORS_LIGHT,
  }), [darkMode])

  // 필터 옵션
  const monthOptions: SelectProps.Option[] = [
    { label: '전체 기간', value: 'all' },
    ...MONTH_ORDER.map((m) => ({ label: m, value: m })),
  ]

  const regionOptions: SelectProps.Option[] = useMemo(() => {
    const regions = [...new Set(data.map((row) => row.region))]
    return [
      { label: '전체 지역', value: 'all' },
      ...regions.map((r) => ({ label: r, value: r })),
    ]
  }, [data])

  // 필터링된 데이터
  const filteredData = useMemo(() => {
    let result = data
    if (selectedMonth && selectedMonth.value !== 'all') {
      result = result.filter((row) => row.month === selectedMonth.value)
    }
    if (selectedRegion && selectedRegion.value !== 'all') {
      result = result.filter((row) => row.region === selectedRegion.value)
    }
    return result
  }, [data, selectedMonth, selectedRegion])

  // 필터 변경 시 페이지 리셋
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedMonth, selectedRegion])

  // 테이블 정렬된 데이터
  const sortedTableData = useMemo(() => {
    const sorted = [...filteredData]
    const field = sortingColumn.sortingField as keyof SalesRow
    sorted.sort((a, b) => {
      const aVal = a[field]
      const bVal = b[field]
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortingDescending ? bVal - aVal : aVal - bVal
      }
      return sortingDescending
        ? String(bVal).localeCompare(String(aVal))
        : String(aVal).localeCompare(String(bVal))
    })
    return sorted
  }, [filteredData, sortingColumn, sortingDescending])

  const PAGE_SIZE = 10
  const paginatedData = sortedTableData.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  if (loading) {
    return (
      <Box textAlign="center" padding={{ top: 'xxxl' }}>
        <Spinner size="large" />
      </Box>
    )
  }

  // 핵심 지표 계산
  const totalRevenue = filteredData.reduce((sum, row) => sum + row.revenue, 0)
  const totalCustomers = filteredData.reduce((sum, row) => sum + row.customers, 0)
  const avgGrowthRate = filteredData.length > 0
    ? filteredData.reduce((sum, row) => sum + row.growthRate, 0) / filteredData.length
    : 0
  const productCount = new Set(filteredData.map((row) => row.product)).size

  // 월별 매출 추이 데이터 (매출액 + 평균 성장률)
  const monthlyRevenue = MONTH_ORDER.map((month) => {
    const monthData = filteredData.filter((row) => row.month === month)
    const revenue = monthData.reduce((sum, row) => sum + row.revenue, 0)
    const avgGrowth = monthData.length > 0
      ? monthData.reduce((sum, row) => sum + row.growthRate, 0) / monthData.length
      : 0
    return {
      month,
      매출액: revenue,
      평균성장률: Number(avgGrowth.toFixed(1)),
    }
  })

  // 지역별 매출 비교 데이터
  const regions = [...new Set(data.map((row) => row.region))]
  const regionRevenue = regions.map((region) => {
    const regionData = filteredData.filter((row) => row.region === region)
    return {
      region,
      매출액: regionData.reduce((sum, row) => sum + row.revenue, 0),
    }
  }).filter((r) => r.매출액 > 0)

  // 페이지 이름 매핑
  const pageNames: Record<string, string> = {
    dashboard: '매출 분석',
    meeting: '회의록',
    notices: '공지사항',
    team: '팀 소개',
  }

  // 브레드크럼
  const breadcrumbs = (
    <BreadcrumbGroup
      items={[
        { text: 'Team Dashboard', href: '#/' },
        { text: pageNames[activePage] || '매출 분석', href: `#/${activePage}` },
      ]}
      onFollow={(event) => {
        event.preventDefault()
        const href = event.detail.href
        if (href === '#/') setActivePage('dashboard')
      }}
    />
  )

  const navigation = (
    <SideNavigation
      activeHref={`#/${activePage}`}
      header={{ href: '#/', text: 'Team Dashboard' }}
      onFollow={(event) => {
        event.preventDefault()
        const href = event.detail.href
        if (href === '#/' || href === '#/dashboard') setActivePage('dashboard')
        else if (href === '#/team') setActivePage('team')
        else if (href === '#/notices') setActivePage('notices')
        else if (href === '#/meeting') setActivePage('meeting')
      }}
      items={[
        { type: 'link', text: '매출 분석', href: '#/dashboard', info: <Box variant="small">📊</Box> },
        { type: 'link', text: '회의록', href: '#/meeting', info: <Box variant="small">📝</Box> },
        { type: 'link', text: '공지사항', href: '#/notices', info: <Box variant="small">📢</Box> },
        { type: 'link', text: '팀 소개', href: '#/team', info: <Box variant="small">👥</Box> },
        { type: 'divider' },
        { type: 'link', text: '© 2026 클라우드 솔루션팀', href: '#/' },
      ]}
    />
  )

  const renderDashboardContent = () => (
    <ContentLayout
      header={
        <Header
          variant="h1"
          actions={
            <SpaceBetween direction="horizontal" size="m">
              <Button
                iconName="upload"
                onClick={() => fileInputRef.current?.click()}
              >
                CSV 업로드
              </Button>
              <Toggle
                onChange={({ detail }) => setDarkMode(detail.checked)}
                checked={darkMode}
              >
                다크 모드
              </Toggle>
            </SpaceBetween>
          }
        >
          매출 분석 대시보드
        </Header>
      }
    >
      <SpaceBetween size="l">
        <input type="file" ref={fileInputRef} accept=".csv" style={{ display: 'none' }} onChange={handleFileUpload} />
        {flashMessages.length > 0 && <Flashbar items={flashMessages} />}

        <Container>
          <Grid gridDefinition={[{ colspan: 3 }, { colspan: 3 }, { colspan: 6 }]}>
            <Select selectedOption={selectedMonth ?? monthOptions[0]} onChange={({ detail }) => setSelectedMonth(detail.selectedOption)} options={monthOptions} placeholder="기간 선택" />
            <Select selectedOption={selectedRegion ?? regionOptions[0]} onChange={({ detail }) => setSelectedRegion(detail.selectedOption)} options={regionOptions} placeholder="지역 선택" />
            <Box variant="p" color="text-status-inactive" padding={{ top: 'xs' }}>필터를 변경하면 모든 차트와 지표가 자동으로 업데이트됩니다.</Box>
          </Grid>
        </Container>

        <Grid gridDefinition={[{ colspan: 3 }, { colspan: 3 }, { colspan: 3 }, { colspan: 3 }]}>
          <Container><Box variant="awsui-key-label">총 매출액</Box><Box variant="h1">{totalRevenue.toLocaleString()}만원</Box></Container>
          <Container><Box variant="awsui-key-label">총 고객수</Box><Box variant="h1">{totalCustomers.toLocaleString()}명</Box></Container>
          <Container><Box variant="awsui-key-label">평균 성장률</Box><Box variant="h1">{avgGrowthRate.toFixed(1)}%</Box></Container>
          <Container><Box variant="awsui-key-label">제품 수</Box><Box variant="h1">{productCount}개</Box></Container>
        </Grid>

        <Container header={<Header variant="h2">월별 매출액 & 성장률</Header>}>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={monthlyRevenue} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis dataKey="month" tick={{ fill: chartColors.text }} />
              <YAxis yAxisId="left" tickFormatter={(value) => `${(value / 10000).toFixed(1)}억`} tick={{ fill: chartColors.text }} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value}%`} tick={{ fill: chartColors.text }} domain={[0, 'auto']} />
              <Tooltip formatter={(value, name) => { if (name === '매출액') return [`${Number(value).toLocaleString()}만원`, '매출액']; return [`${value}%`, '평균 성장률'] }} contentStyle={{ backgroundColor: chartColors.tooltipBg, borderColor: chartColors.grid, color: chartColors.text }} />
              <Legend wrapperStyle={{ color: chartColors.text }} />
              <Bar yAxisId="left" dataKey="매출액" fill={chartColors.primary} radius={[4, 4, 0, 0]} opacity={0.8} />
              <Line yAxisId="right" type="monotone" dataKey="평균성장률" stroke={darkMode ? '#eb8f6a' : '#e07941'} strokeWidth={2} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </Container>

        <Grid gridDefinition={[{ colspan: 6 }, { colspan: 6 }]}>
          <Container header={<Header variant="h2">지역별 매출 비교</Header>}>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={regionRevenue} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis dataKey="region" tick={{ fill: chartColors.text }} />
                <YAxis tickFormatter={(value) => `${(value / 10000).toFixed(1)}억`} tick={{ fill: chartColors.text }} />
                <Tooltip formatter={(value) => [`${Number(value).toLocaleString()}만원`, '매출액']} contentStyle={{ backgroundColor: chartColors.tooltipBg, borderColor: chartColors.grid, color: chartColors.text }} />
                <Legend wrapperStyle={{ color: chartColors.text }} />
                <Bar dataKey="매출액" fill={chartColors.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Container>
          <Container header={<Header variant="h2">지역별 매출 비중</Header>}>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie data={regionRevenue} dataKey="매출액" nameKey="region" cx="50%" cy="50%" outerRadius={120} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(1)}%`} labelLine={{ stroke: chartColors.text }}>
                  {regionRevenue.map((_, index) => (<Cell key={`cell-${index}`} fill={chartColors.pieColors[index % chartColors.pieColors.length]} />))}
                </Pie>
                <Tooltip formatter={(value) => [`${Number(value).toLocaleString()}만원`, '매출액']} contentStyle={{ backgroundColor: chartColors.tooltipBg, borderColor: chartColors.grid, color: chartColors.text }} />
                <Legend wrapperStyle={{ color: chartColors.text }} />
              </PieChart>
            </ResponsiveContainer>
          </Container>
        </Grid>

        <Table
          header={<Header variant="h2" counter={`(${filteredData.length})`}>매출 데이터</Header>}
          columnDefinitions={[
            { id: 'month', header: '월', cell: (item) => item.month, sortingField: 'month' },
            { id: 'product', header: '제품명', cell: (item) => item.product, sortingField: 'product' },
            { id: 'revenue', header: '매출액(만원)', cell: (item) => item.revenue.toLocaleString(), sortingField: 'revenue' },
            { id: 'customers', header: '고객수', cell: (item) => item.customers.toLocaleString(), sortingField: 'customers' },
            { id: 'region', header: '지역', cell: (item) => item.region, sortingField: 'region' },
            { id: 'growthRate', header: '성장률(%)', cell: (item) => `${item.growthRate}%`, sortingField: 'growthRate' },
          ]}
          items={paginatedData}
          sortingColumn={sortingColumn}
          sortingDescending={sortingDescending}
          onSortingChange={({ detail }) => { setSortingColumn(detail.sortingColumn as { sortingField: string }); setSortingDescending(detail.isDescending ?? false); setCurrentPage(1) }}
          pagination={<Pagination currentPageIndex={currentPage} pagesCount={Math.ceil(filteredData.length / PAGE_SIZE)} onChange={({ detail }) => setCurrentPage(detail.currentPageIndex)} />}
          variant="container"
          stickyHeader
        />
      </SpaceBetween>
    </ContentLayout>
  )

  return (
    <AppLayout
      content={activePage === 'team' ? <TeamPage /> : activePage === 'notices' ? <NoticePage /> : activePage === 'meeting' ? <MeetingMinutesPage /> : renderDashboardContent()}
      navigation={navigation}
      breadcrumbs={breadcrumbs}
      toolsHide
    />
  )
}

export default App
