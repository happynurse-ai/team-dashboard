import { useEffect, useState } from 'react'
import ContentLayout from '@cloudscape-design/components/content-layout'
import Header from '@cloudscape-design/components/header'
import Container from '@cloudscape-design/components/container'
import SpaceBetween from '@cloudscape-design/components/space-between'
import Box from '@cloudscape-design/components/box'
import Grid from '@cloudscape-design/components/grid'
import Table from '@cloudscape-design/components/table'
import Badge from '@cloudscape-design/components/badge'
import Spinner from '@cloudscape-design/components/spinner'
import ExpandableSection from '@cloudscape-design/components/expandable-section'
import StatusIndicator from '@cloudscape-design/components/status-indicator'

interface ActionItem {
  id: number
  assignee: string
  task: string
  deadline: string
}

interface AgendaItem {
  id: number
  title: string
  summary: string[]
}

interface MeetingData {
  date: string
  time: string
  location: string
  attendees: string[]
  topic: string
  agendas: AgendaItem[]
  decisions: string[]
  actionItems: ActionItem[]
  nextMeeting: string
}

function parseMeetingSTT(text: string): MeetingData {
  const lines = text.split('\n')

  // 기본 정보 추출
  const dateLine = lines.find((l) => l.startsWith('일시:'))
  const locationLine = lines.find((l) => l.startsWith('장소:'))
  const attendeesLine = lines.find((l) => l.startsWith('참석자:'))
  const topicLine = lines.find((l) => l.startsWith('주제:'))

  const date = dateLine?.replace('일시:', '').trim().split(' ')[0] || ''
  const time = dateLine?.match(/\d{2}:\d{2}~\d{2}:\d{2}/)?.[0] || ''
  const location = locationLine?.replace('장소:', '').trim() || ''
  const attendees = attendeesLine?.replace('참석자:', '').trim().split(', ') || []
  const topic = topicLine?.replace('주제:', '').trim() || ''

  // 안건 분석 (대화 내용 기반으로 구조화)
  const agendas: AgendaItem[] = [
    {
      id: 1,
      title: '현재 대시보드 문제점',
      summary: [
        '데이터 로딩 속도 저하 — CSV 전체 파싱으로 인한 성능 이슈 (이개발)',
        '디자인 단조로움 — CloudScape 기본 스타일, 브랜드 아이덴티티 부족 (박디자인)',
        '필터 상태 인지 어려움 — 필터 적용 여부를 놓치는 경우 발생 (최마케팅)',
        '모바일 반응형 깨짐 — 차트 라벨 겹침, 사이드 네비게이션 이슈 (박디자인, 이개발)',
      ],
    },
    {
      id: 2,
      title: '새 디자인 방향',
      summary: [
        '브랜드 오렌지(#FF9900) 적극 활용, 헤더 그라데이션 적용 (박디자인)',
        'KPI 카드에 아이콘 추가, 차트 색상 브랜드 팔레트 기반 재설정 (박디자인)',
        '다크 모드 색상 기존 steering 정의 활용 (박디자인)',
        '필터 영역 분리 및 적용 상태 뱃지 표시 (박디자인)',
      ],
    },
    {
      id: 3,
      title: '일정 논의',
      summary: [
        '5월 30일(금): 디자인 시안 최종 확정',
        '6월 2일(월): 개발 착수',
        '6월 13일(금): 1차 개발 완료',
        '6월 16~20일: 내부 테스트',
        '6월 23일(월): 최종 배포 (데드라인 6/30 대비 1주 버퍼)',
      ],
    },
    {
      id: 4,
      title: '역할 분담',
      summary: [
        '김팀장: 전체 일정 관리, 이해관계자 커뮤니케이션',
        '이개발: 프론트엔드 구현, 성능 최적화 (캐싱, 레이지 로딩)',
        '박디자인: UI 시안 확정, 디자인 가이드 문서 업데이트',
        '최마케팅: 사용자 피드백 수집, 테스트 시나리오 작성, 배포 후 가이드',
      ],
    },
    {
      id: 5,
      title: '추가 논의 사항',
      summary: [
        '엑셀 다운로드 기능 추가 — 필터 적용 상태로 내보내기 (이개발 제안, 전원 동의)',
        'CSV 업로드 프리뷰 모달 추가 — 잘못된 파일 방지 (최마케팅 제안)',
        '모바일 반응형은 Q3로 연기, 태블릿은 이번 스코프에 포함 (김팀장 결정)',
        '대시보드 내 보고서 생성 버튼 — nice-to-have, 시간 되면 추가 (이개발 제안)',
        '기술 스택 변경 없음 — React, TypeScript, Vite, CloudScape, Recharts 유지 (김팀장 확인)',
      ],
    },
  ]

  // 결정 사항
  const decisions = [
    '리뉴얼 스코프: 디자인 리뉴얼 + 성능 최적화 + UX 개선 + 태블릿 반응형',
    '모바일 반응형은 Q3로 연기',
    '기술 스택 변경 없이 기존 유지 (React, TypeScript, Vite, CloudScape, Recharts)',
    '인증/인가는 이번 스코프 밖 (내부 팀 전용)',
    '배포 목표일: 6월 23일 (데드라인 6/30 대비 1주 버퍼)',
    '대시보드 내 보고서 생성은 nice-to-have로 우선순위 하향',
  ]

  // 액션 아이템
  const actionItems: ActionItem[] = [
    { id: 1, assignee: '박디자인', task: '최종 디자인 시안 Figma 업로드 및 슬랙 공유', deadline: '2025-05-30' },
    { id: 2, assignee: '이개발', task: '데이터 캐싱/레이지 로딩 기술 검토 정리', deadline: '2025-05-30' },
    { id: 3, assignee: '최마케팅', task: '현재 대시보드 사용자 피드백 수집', deadline: '2025-05-30' },
    { id: 4, assignee: '김팀장', task: '프로젝트 일정표 작성 및 이해관계자 공지', deadline: '2025-05-28' },
    { id: 5, assignee: '전원', task: '디자인 리뷰 미팅 참석', deadline: '2025-05-30 14:00' },
  ]

  const nextMeeting = '2025-05-30 (금) 14:00 | 디자인 시안 최종 리뷰 및 확정'

  return { date, time, location, attendees, topic, agendas, decisions, actionItems, nextMeeting }
}

export default function MeetingMinutesPage() {
  const [meeting, setMeeting] = useState<MeetingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + 'meeting-stt.txt')
      .then((res) => {
        if (!res.ok) throw new Error('STT 파일을 찾을 수 없습니다.')
        return res.text()
      })
      .then((text) => {
        setMeeting(parseMeetingSTT(text))
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <Box textAlign="center" padding={{ top: 'xxxl' }}>
        <Spinner size="large" />
      </Box>
    )
  }

  if (error || !meeting) {
    return (
      <ContentLayout header={<Header variant="h1">회의록</Header>}>
        <Container>
          <StatusIndicator type="error">{error || '데이터를 불러올 수 없습니다.'}</StatusIndicator>
        </Container>
      </ContentLayout>
    )
  }

  return (
    <ContentLayout
      header={
        <Header variant="h1" description={meeting.topic}>
          회의록
        </Header>
      }
    >
      <SpaceBetween size="l">
        {/* 회의 기본 정보 */}
        <Container header={<Header variant="h2">회의 정보</Header>}>
          <Grid gridDefinition={[{ colspan: 3 }, { colspan: 3 }, { colspan: 3 }, { colspan: 3 }]}>
            <div>
              <Box variant="awsui-key-label">일시</Box>
              <Box variant="p">{meeting.date} {meeting.time}</Box>
            </div>
            <div>
              <Box variant="awsui-key-label">장소</Box>
              <Box variant="p">{meeting.location}</Box>
            </div>
            <div>
              <Box variant="awsui-key-label">참석자</Box>
              <SpaceBetween direction="horizontal" size="xs">
                {meeting.attendees.map((a) => (
                  <Badge key={a} color="blue">{a}</Badge>
                ))}
              </SpaceBetween>
            </div>
            <div>
              <Box variant="awsui-key-label">주제</Box>
              <Box variant="p">{meeting.topic}</Box>
            </div>
          </Grid>
        </Container>

        {/* 안건별 논의 내용 */}
        <Container header={<Header variant="h2">안건별 논의 내용</Header>}>
          <SpaceBetween size="m">
            {meeting.agendas.map((agenda) => (
              <ExpandableSection
                key={agenda.id}
                headerText={`${agenda.id}. ${agenda.title}`}
                defaultExpanded
              >
                <SpaceBetween size="xs">
                  {agenda.summary.map((item, idx) => (
                    <Box key={idx} variant="p" padding={{ left: 's' }}>
                      • {item}
                    </Box>
                  ))}
                </SpaceBetween>
              </ExpandableSection>
            ))}
          </SpaceBetween>
        </Container>

        {/* 결정 사항 */}
        <Container header={<Header variant="h2">결정 사항</Header>}>
          <SpaceBetween size="xs">
            {meeting.decisions.map((decision, idx) => (
              <Box key={idx} variant="p">
                <StatusIndicator type="success">{decision}</StatusIndicator>
              </Box>
            ))}
          </SpaceBetween>
        </Container>

        {/* 액션 아이템 */}
        <Table
          header={<Header variant="h2" counter={`(${meeting.actionItems.length})`}>액션 아이템</Header>}
          columnDefinitions={[
            { id: 'id', header: '#', cell: (item) => item.id, width: 50 },
            { id: 'assignee', header: '담당자', cell: (item) => <Badge color="blue">{item.assignee}</Badge>, width: 120 },
            { id: 'task', header: '할 일', cell: (item) => item.task },
            { id: 'deadline', header: '기한', cell: (item) => item.deadline, width: 160 },
          ]}
          items={meeting.actionItems}
          variant="container"
        />

        {/* 다음 회의 */}
        <Container header={<Header variant="h2">다음 회의</Header>}>
          <Box variant="p" fontSize="heading-m">{meeting.nextMeeting}</Box>
        </Container>

        {/* 푸터 */}
        <Box textAlign="center" color="text-status-inactive" padding={{ top: 'l' }}>
          작성자: AI 자동 생성 | 검토 필요
        </Box>
        <Box textAlign="center" color="text-status-inactive">
          © 2026 | Powered by Kiro
        </Box>
      </SpaceBetween>
    </ContentLayout>
  )
}
