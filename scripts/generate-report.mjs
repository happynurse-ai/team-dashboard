/**
 * 매출 보고서 생성 스크립트
 * Steering 보고서 양식 규칙을 따릅니다.
 *
 * 사용법:
 *   node scripts/generate-report.mjs          → 2025년 연간 보고서
 *   node scripts/generate-report.mjs --quarter 4  → 4분기 보고서
 */

import { readFileSync, mkdirSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  PageNumber,
  Footer,
  Header,
  ShadingType,
} from 'docx'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// --- 인자 파싱 ---
const args = process.argv.slice(2)
let quarter = null
const qIdx = args.indexOf('--quarter')
if (qIdx !== -1 && args[qIdx + 1]) {
  quarter = parseInt(args[qIdx + 1], 10)
}

// --- CSV 읽기 및 파싱 ---
const csvPath = resolve(ROOT, 'public/data-2025.csv')
const csvText = readFileSync(csvPath, 'utf-8')
const lines = csvText.trim().split('\n')
const rows = lines.slice(1).map((line) => {
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

// --- 분기 필터링 ---
const QUARTER_MONTHS = {
  1: ['1월', '2월', '3월'],
  2: ['4월', '5월', '6월'],
  3: ['7월', '8월', '9월'],
  4: ['10월', '11월', '12월'],
}

const filteredRows = quarter
  ? rows.filter((r) => QUARTER_MONTHS[quarter].includes(r.month))
  : rows

const periodLabel = quarter ? `2025년 ${quarter}분기` : '2025년 연간'
const fileName = quarter ? `매출보고서_2025-Q${quarter}.docx` : '매출보고서_2025-연간.docx'

// --- 데이터 분석 ---
const totalRevenue = filteredRows.reduce((s, r) => s + r.revenue, 0)
const totalCustomers = filteredRows.reduce((s, r) => s + r.customers, 0)
const avgGrowthRate = (filteredRows.reduce((s, r) => s + r.growthRate, 0) / filteredRows.length).toFixed(1)

// 제품별 비중
const productMap = {}
filteredRows.forEach((r) => {
  productMap[r.product] = (productMap[r.product] || 0) + r.revenue
})
const productShare = Object.entries(productMap)
  .sort((a, b) => b[1] - a[1])
  .map(([name, rev]) => ({ name, revenue: rev, share: ((rev / totalRevenue) * 100).toFixed(1) }))

// 지역별 현황
const regionMap = {}
filteredRows.forEach((r) => {
  if (!regionMap[r.region]) regionMap[r.region] = { revenue: 0, customers: 0, growthRates: [] }
  regionMap[r.region].revenue += r.revenue
  regionMap[r.region].customers += r.customers
  regionMap[r.region].growthRates.push(r.growthRate)
})
const regionStats = Object.entries(regionMap).map(([region, data]) => ({
  region,
  revenue: data.revenue,
  customers: data.customers,
  avgGrowth: (data.growthRates.reduce((s, v) => s + v, 0) / data.growthRates.length).toFixed(1),
}))
regionStats.sort((a, b) => b.revenue - a.revenue)

// 월별 추이
const MONTH_ORDER = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
const monthlyRevenue = MONTH_ORDER
  .filter((m) => filteredRows.some((r) => r.month === m))
  .map((month) => {
    const monthData = filteredRows.filter((r) => r.month === month)
    return { month, revenue: monthData.reduce((s, r) => s + r.revenue, 0) }
  })

const maxMonth = monthlyRevenue.reduce((a, b) => (a.revenue > b.revenue ? a : b))
const minMonth = monthlyRevenue.reduce((a, b) => (a.revenue < b.revenue ? a : b))

// --- 보고서 생성 ---
const today = new Date()
const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`

// 브랜드 컬러
const BRAND_ORANGE = 'FF9900'
const BRAND_DARK = '232F3E'
const HEADER_BG = 'F5F5F5'

// 테이블 셀 기본 border
const defaultBorder = {
  top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
  left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
  right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
}

function createHeaderCell(text) {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true, size: 20, color: BRAND_DARK })],
        alignment: AlignmentType.CENTER,
      }),
    ],
    shading: { type: ShadingType.SOLID, color: HEADER_BG },
    borders: defaultBorder,
    width: { size: 25, type: WidthType.PERCENTAGE },
  })
}

function createDataCell(text, alignment = AlignmentType.CENTER) {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, size: 20 })],
        alignment,
      }),
    ],
    borders: defaultBorder,
    width: { size: 25, type: WidthType.PERCENTAGE },
  })
}

function createTotalCell(text) {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true, size: 20, color: BRAND_ORANGE })],
        alignment: AlignmentType.CENTER,
      }),
    ],
    shading: { type: ShadingType.SOLID, color: 'FFF8F0' },
    borders: defaultBorder,
    width: { size: 25, type: WidthType.PERCENTAGE },
  })
}

// Steering 규칙: 제목 형식 "[팀명] YYYY년 N분기 매출 보고서"
const reportTitle = quarter
  ? `[클라우드 솔루션팀] 2025년 ${quarter}분기 매출 보고서`
  : '[클라우드 솔루션팀] 2025년 연간 매출 보고서'

const doc = new Document({
  sections: [
    {
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: '클라우드 솔루션팀', bold: true, size: 18, color: BRAND_DARK }),
                new TextRun({ text: '  |  매출 보고서', size: 18, color: '666666' }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: '- ', size: 18 }),
                new TextRun({ children: [PageNumber.CURRENT], size: 18 }),
                new TextRun({ text: ' -', size: 18 }),
              ],
            }),
          ],
        }),
      },
      children: [
        // --- 제목 ---
        new Paragraph({
          children: [new TextRun({ text: reportTitle, bold: true, size: 36, color: BRAND_DARK })],
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [new TextRun({ text: `작성일: ${dateStr}`, size: 20, color: '666666' })],
          spacing: { after: 400 },
        }),

        // --- 1. 요약 (Steering 규칙: 3줄 이내) ---
        new Paragraph({
          children: [new TextRun({ text: '1. 요약', bold: true, size: 28, color: BRAND_DARK })],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `${periodLabel} 총 매출액은 ${totalRevenue.toLocaleString()}만원이며, 총 고객수 ${totalCustomers.toLocaleString()}명, 평균 성장률 ${avgGrowthRate}%를 기록했습니다.`,
              size: 22,
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `제품별 매출 비중은 ${productShare.map((p) => `${p.name}(${p.share}%)`).join(', ')} 순입니다.`,
              size: 22,
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `최고 매출 월은 ${maxMonth.month}(${maxMonth.revenue.toLocaleString()}만원), 최저 매출 월은 ${minMonth.month}(${minMonth.revenue.toLocaleString()}만원)입니다.`,
              size: 22,
            }),
          ],
          spacing: { after: 400 },
        }),

        // --- 2. 지역별 현황 표 (Steering 규칙: 합계 행 포함) ---
        new Paragraph({
          children: [new TextRun({ text: '2. 지역별 현황', bold: true, size: 28, color: BRAND_DARK })],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 },
        }),
        new Table({
          rows: [
            // 헤더
            new TableRow({
              children: [
                createHeaderCell('지역'),
                createHeaderCell('매출액(만원)'),
                createHeaderCell('고객수'),
                createHeaderCell('평균 성장률(%)'),
              ],
            }),
            // 데이터 행
            ...regionStats.map(
              (r) =>
                new TableRow({
                  children: [
                    createDataCell(r.region),
                    createDataCell(r.revenue.toLocaleString()),
                    createDataCell(r.customers.toLocaleString()),
                    createDataCell(`${r.avgGrowth}%`),
                  ],
                })
            ),
            // 합계 행
            new TableRow({
              children: [
                createTotalCell('합계'),
                createTotalCell(totalRevenue.toLocaleString()),
                createTotalCell(totalCustomers.toLocaleString()),
                createTotalCell(`${avgGrowthRate}%`),
              ],
            }),
          ],
          width: { size: 100, type: WidthType.PERCENTAGE },
        }),

        // --- 3. 월별 추이 설명 (Steering 규칙: 한 문장 요약) ---
        new Paragraph({
          children: [new TextRun({ text: '3. 월별 추이', bold: true, size: 28, color: BRAND_DARK })],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `${periodLabel} 월별 매출은 ${minMonth.month} ${minMonth.revenue.toLocaleString()}만원에서 ${maxMonth.month} ${maxMonth.revenue.toLocaleString()}만원까지 분포하며, 하반기로 갈수록 상승 추세를 보입니다.`,
              size: 22,
            }),
          ],
          spacing: { after: 400 },
        }),

        // --- 4. 추천 액션 ---
        new Paragraph({
          children: [new TextRun({ text: '4. 추천 액션', bold: true, size: 28, color: BRAND_DARK })],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: '① ', bold: true, size: 22 }),
            new TextRun({
              text: `${regionStats[regionStats.length - 1].region} 지역 매출 강화: 매출 최하위 지역인 ${regionStats[regionStats.length - 1].region}(${regionStats[regionStats.length - 1].revenue.toLocaleString()}만원)에 대한 영업 전략 재수립 및 마케팅 투자 확대를 권장합니다.`,
              size: 22,
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: '② ', bold: true, size: 22 }),
            new TextRun({
              text: `${productShare[0].name} 집중 투자: 매출 비중 ${productShare[0].share}%로 1위인 ${productShare[0].name}의 고객 확대 및 업셀링 전략을 강화하여 시장 점유율을 확대합니다.`,
              size: 22,
            }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: '③ ', bold: true, size: 22 }),
            new TextRun({
              text: `성장률 상위 제품 육성: 평균 성장률이 높은 제품군에 R&D 투자를 집중하여 차기 주력 제품으로 육성합니다.`,
              size: 22,
            }),
          ],
          spacing: { after: 200 },
        }),
      ],
    },
  ],
})

// --- 파일 저장 ---
const outputDir = resolve(ROOT, 'public/reports')
mkdirSync(outputDir, { recursive: true })
const outputPath = resolve(outputDir, fileName)

const buffer = await Packer.toBuffer(doc)
writeFileSync(outputPath, buffer)

console.log(`✅ 보고서 생성 완료: public/reports/${fileName}`)
console.log(`   기간: ${periodLabel}`)
console.log(`   총 매출액: ${totalRevenue.toLocaleString()}만원`)
console.log(`   총 고객수: ${totalCustomers.toLocaleString()}명`)
console.log(`   평균 성장률: ${avgGrowthRate}%`)
console.log(`   데이터 행수: ${filteredRows.length}행`)
