import ContentLayout from '@cloudscape-design/components/content-layout'
import Header from '@cloudscape-design/components/header'
import Container from '@cloudscape-design/components/container'
import SpaceBetween from '@cloudscape-design/components/space-between'
import Box from '@cloudscape-design/components/box'
import Grid from '@cloudscape-design/components/grid'
import Link from '@cloudscape-design/components/link'
import Cards from '@cloudscape-design/components/cards'

// 팀원 데이터 인터페이스
interface TeamMember {
  name: string
  role: string
  bio: string
  email: string
  initial: string
}

// 팀원 목록
const TEAM_MEMBERS: TeamMember[] = [
  {
    name: '김서준',
    role: '팀 리더 / 솔루션 아키텍트',
    bio: '10년차 클라우드 아키텍트. 대규모 마이그레이션 프로젝트를 이끌고 있습니다.',
    email: 'seojun.kim@example.com',
    initial: '김',
  },
  {
    name: '이하은',
    role: '시니어 개발자',
    bio: 'Full-stack 개발자로 서버리스 아키텍처 전문가입니다.',
    email: 'haeun.lee@example.com',
    initial: '이',
  },
  {
    name: '박도윤',
    role: 'DevOps 엔지니어',
    bio: 'CI/CD 파이프라인과 인프라 자동화를 담당하고 있습니다.',
    email: 'doyun.park@example.com',
    initial: '박',
  },
  {
    name: '최수아',
    role: '데이터 엔지니어',
    bio: '데이터 파이프라인 설계와 분석 플랫폼 구축을 담당합니다.',
    email: 'sua.choi@example.com',
    initial: '최',
  },
]

export default function TeamPage() {
  return (
    <ContentLayout
      header={
        <Header variant="h1" description="고객의 클라우드 여정을 가속화합니다">
          클라우드 솔루션팀
        </Header>
      }
    >
      <SpaceBetween size="l">
        {/* 미션 섹션 */}
        <Container header={<Header variant="h2">미션</Header>}>
          <Box variant="p" fontSize="heading-m">
            "고객의 클라우드 여정을 가속화합니다"
          </Box>
          <Box variant="p" color="text-status-inactive" padding={{ top: 's' }}>
            우리 팀은 고객이 클라우드의 잠재력을 최대한 활용할 수 있도록 설계, 구축, 운영 전 과정을 지원합니다.
          </Box>
        </Container>

        {/* 팀원 카드 - 3열 그리드 (디자인 규칙 준수) */}
        <Cards
          cardDefinition={{
            header: (item) => (
              <SpaceBetween size="xxs">
                <Box variant="h3">{item.name}</Box>
                <Box variant="small" color="text-status-inactive">{item.role}</Box>
              </SpaceBetween>
            ),
            sections: [
              {
                id: 'image',
                content: (item) => (
                  <Box textAlign="center" padding={{ bottom: 's' }}>
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(item.initial)}&background=FF9900&color=fff&size=80&font-size=0.4&bold=true`}
                      alt={`${item.name} 프로필`}
                      width={80}
                      height={80}
                      style={{ borderRadius: '50%' }}
                    />
                  </Box>
                ),
              },
              {
                id: 'bio',
                header: '소개',
                content: (item) => item.bio,
              },
              {
                id: 'email',
                header: '이메일',
                content: (item) => <Link href={`mailto:${item.email}`}>{item.email}</Link>,
              },
            ],
          }}
          items={TEAM_MEMBERS}
          header={<Header variant="h2">팀원 소개</Header>}
          cardsPerRow={[{ cards: 1 }, { minWidth: 500, cards: 2 }, { minWidth: 900, cards: 3 }]}
        />

        {/* 팀 정보 요약 */}
        <Grid gridDefinition={[{ colspan: 4 }, { colspan: 4 }, { colspan: 4 }]}>
          <Container>
            <Box variant="awsui-key-label">팀원 수</Box>
            <Box variant="h1">4명</Box>
          </Container>
          <Container>
            <Box variant="awsui-key-label">설립</Box>
            <Box variant="h1">2022년</Box>
          </Container>
          <Container>
            <Box variant="awsui-key-label">완료 프로젝트</Box>
            <Box variant="h1">47건</Box>
          </Container>
        </Grid>

        {/* 푸터 */}
        <Box textAlign="center" color="text-status-inactive" padding={{ top: 'l' }}>
          © 2026 | Powered by Kiro
        </Box>
      </SpaceBetween>
    </ContentLayout>
  )
}
