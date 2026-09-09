import { useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'

export type StudyRecords = Record<string, number>

interface StudyCalendarModalProps {
  show: boolean
  onClose: () => void
  records: StudyRecords
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`

const Content = styled.div<{ $isOpen: boolean }>`
  position: relative;
  box-sizing: border-box;
  width: min(760px, 100%);
  max-height: calc(100vh - 40px);
  overflow: auto;
  padding: 30px 34px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 10px;
  background: rgba(12, 18, 28, 0.88);
  color: #fff;
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(16px);
  opacity: ${props => (props.$isOpen ? 1 : 0)};
  transform: ${props => (props.$isOpen ? 'scale(1)' : 'scale(1.03)')};
  transition: opacity 0.2s ease, transform 0.2s ease;

  @media (max-width: 600px) {
    padding: 28px 20px;
  }
`

const CloseButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: #fff;
  font-size: 25px;
  line-height: 1;
  cursor: pointer;

  &:hover { background: rgba(255, 255, 255, 0.13); }
`

const Title = styled.h2`
  margin: 0 40px 8px 0;
  font-size: 22px;
`

const Summary = styled.p`
  margin: 0 0 24px;
  color: rgba(255, 255, 255, 0.74);
  font-size: 14px;
`

const CalendarArea = styled.div`
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: 8px;
  min-width: 610px;
`

const WeekLabels = styled.div`
  display: grid;
  grid-template-rows: 20px repeat(7, 11px);
  gap: 4px;
  color: rgba(255, 255, 255, 0.62);
  font-size: 10px;
  line-height: 11px;
`

const Heatmap = styled.div`
  display: grid;
  grid-template-columns: repeat(53, 11px);
  grid-template-rows: 20px repeat(7, 11px);
  grid-auto-flow: column;
  gap: 4px;
`

const Month = styled.span`
  grid-row: 1;
  align-self: start;
  color: rgba(255, 255, 255, 0.62);
  font-size: 10px;
  line-height: 12px;
  white-space: nowrap;
`

const Day = styled.span<{ $level: number; $future: boolean }>`
  width: 11px;
  height: 11px;
  border-radius: 2px;
  background: ${props => {
    if (props.$future) return 'rgba(255, 255, 255, 0.05)'
    return ['rgba(255, 255, 255, 0.13)', '#0e4429', '#006d32', '#26a641', '#39d353'][props.$level]
  }};
`

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 5px;
  margin-top: 22px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
`

const LegendDay = styled(Day)`
  display: inline-block;
`

const formatDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const startOfWeek = (date: Date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = start.getDay()
  start.setDate(start.getDate() - (day === 0 ? 6 : day - 1))
  return start
}

const getLevel = (count: number, maxCount: number) => {
  if (count === 0) return 0
  if (maxCount <= 1) return 1
  return Math.min(4, Math.max(1, Math.ceil((count / maxCount) * 4)))
}

const getCurrentStreak = (records: StudyRecords) => {
  let streak = 0
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)

  while (records[formatDate(cursor)] > 0) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

export const StudyCalendarModal = ({ show, onClose, records }: StudyCalendarModalProps) => {
  const [isVisible, setIsVisible] = useState(show)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (show) {
      setIsVisible(true)
      const timer = window.setTimeout(() => setIsOpen(true), 0)
      return () => window.clearTimeout(timer)
    }
    setIsOpen(false)
  }, [show])

  const handleTransitionEnd = () => {
    if (!isOpen) {
      setIsVisible(false)
    }
  }

  const { days, monthLabels, activeDays, streak, maxCount } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const start = startOfWeek(today)
    start.setDate(start.getDate() - 52 * 7)
    const entries = Array.from({ length: 53 * 7 }, (_, index) => {
      const date = new Date(start)
      date.setDate(start.getDate() + index)
      return date
    })
    const labels = entries.reduce<{ text: string; column: number }[]>((result, date, index) => {
      if (date.getDate() === 1) {
        result.push({ text: `${date.getMonth() + 1}月`, column: Math.floor(index / 7) + 1 })
      }
      return result
    }, [])

    return {
      days: entries,
      monthLabels: labels,
      activeDays: Object.values(records).filter(count => count > 0).length,
      streak: getCurrentStreak(records),
      maxCount: Math.max(...Object.values(records), 0)
    }
  }, [records])

  if (!isVisible) return null

  return (
    <Overlay onClick={onClose}>
      <Content
        $isOpen={isOpen}
        onClick={event => event.stopPropagation()}
        onTransitionEnd={handleTransitionEnd}
      >
        <CloseButton type="button" onClick={onClose} aria-label="关闭学习记录">×</CloseButton>
        <Title>学习记录</Title>
        <Summary>累计学习 {activeDays} 天 · 当前连续学习 {streak} 天</Summary>
        <div style={{ overflowX: 'auto', paddingBottom: '5px' }}>
          <CalendarArea aria-label="最近一年的学习热力图">
            <WeekLabels aria-hidden="true">
              <span />
              <span />
              <span>一</span>
              <span />
              <span>三</span>
              <span />
              <span>五</span>
              <span />
            </WeekLabels>
            <Heatmap>
              {monthLabels.map(label => (
                <Month key={`${label.text}-${label.column}`} style={{ gridColumn: label.column }}>
                  {label.text}
                </Month>
              ))}
              {days.map(date => {
                const key = formatDate(date)
                const count = records[key] || 0
                const future = date > new Date()
                return (
                  <Day
                    key={key}
                    $level={getLevel(count, maxCount)}
                    $future={future}
                    title={future ? `${key}（未来日期）` : `${key}：学习 ${count} 个单词`}
                    aria-label={future ? `${key}，未来日期` : `${key}，学习 ${count} 个单词`}
                  />
                )
              })}
            </Heatmap>
          </CalendarArea>
        </div>
        <Footer>
          <span>少</span>
          {[0, 1, 2, 3, 4].map(level => <LegendDay key={level} $level={level} $future={false} />)}
          <span>多</span>
        </Footer>
      </Content>
    </Overlay>
  )
}
