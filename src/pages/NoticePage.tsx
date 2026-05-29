import ContentLayout from '@cloudscape-design/components/content-layout'
import Header from '@cloudscape-design/components/header'
import SpaceBetween from '@cloudscape-design/components/space-between'
import Box from '@cloudscape-design/components/box'
import Badge from '@cloudscape-design/components/badge'
import Cards from '@cloudscape-design/components/cards'

// 공지사항 데이터 인터페이스
interface Notice {
  id: number
  title: string
  date: string
  summary: string
  important: boolean
}

// 공지사항 목록 (최신순 정렬)
const NOTICES: Notice[] = [
  {
    id: 1,
    title: '2026년 상반기 클라우드 인프라 점검 안내',
    date: '2026-05-25',
    summary: '6월 1일(일) 02:00~06:00 정기 점검이 예정되어 있습니다. 해당 시간 동안 일부 서비스 접속이 제한될 수 있으니 사전에 작업을 완료해주세요.',
    important: true,
  },
  {
    id: 2,
    title: '팀 워크숍 일정 변경',
    date: '2026-05-20',
    summary: '기존 6월 15일로 예정되었던 팀 워크숍이 6월 22일로 변경되었습니다. 장소는 동일하게 판교 오피스 3층 대회의실입니다.',
    important: false,
  },
  {
    id: 3,
    title: '신규 보안 정책 적용 안내',
    date: '2026-05-15',
    summary: 'MFA 2단계 인증이 전 직원 필수로 적용됩니다. 5월 31일까지 설정을 완료해주세요. 미설정 시 시스템 접근이 제한됩니다.',
    important: true,
  },
]

export default function NoticePage() {
  return (
    <ContentLayout
      header={
        <Header variant="h1" description="팀 공지사항 및 안내">
          공지사항
        </Header>
      }
    >
      <SpaceBetween size="l">
        {/* 공지사항 카드 목록 */}
        <Cards
          cardDefinition={{
            header: (item) => (
              <SpaceBetween direction="horizontal" size="xs">
                <Box variant="h3">{item.title}</Box>
                {item.important && <Badge color="red">중요</Badge>}
              </SpaceBetween>
            ),
            sections: [
              {
                id: 'date',
                header: '날짜',
                content: (item) => item.date,
              },
              {
                id: 'summary',
                header: '내용',
                content: (item) => item.summary,
              },
            ],
          }}
          items={NOTICES}
          header={
            <Header variant="h2" counter={`(${NOTICES.length})`}>
              전체 공지
            </Header>
          }
          cardsPerRow={[{ cards: 1 }, { minWidth: 700, cards: 3 }]}
        />

        {/* 푸터 */}
        <Box textAlign="center" color="text-status-inactive" padding={{ top: 'l' }}>
          © 2026 | Powered by Kiro
        </Box>
      </SpaceBetween>
    </ContentLayout>
  )
}
