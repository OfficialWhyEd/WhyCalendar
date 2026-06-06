import { useState, useCallback, useMemo } from 'react'
import { addDays, formatDate, isToday, getDayData } from '../utils/date'
import { getTasksByDate } from '../core/storage/local'
import type { DayData } from '../types/index'

export function useDayNavigation() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const goToNextDay = useCallback(() => {
    setSelectedDate(prev => addDays(prev, 1))
  }, [])

  const goToPrevDay = useCallback(() => {
    setSelectedDate(prev => addDays(prev, -1))
  }, [])

  const goToToday = useCallback(() => {
    setSelectedDate(new Date())
  }, [])

  const goToDate = useCallback((date: Date) => {
    setSelectedDate(date)
  }, [])

  const dayData = useMemo((): DayData => {
    const tasks = getTasksByDate(formatDate(selectedDate))
    const completed = tasks.filter(t => t.status === 'completed').length
    const completionRate = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0
    const info = getDayData(selectedDate)

    return {
      ...info,
      tasks,
      isToday: isToday(selectedDate),
      isPast: selectedDate < new Date(new Date().toDateString()),
      isFuture: selectedDate > new Date(new Date().toDateString()),
      completionRate,
    }
  }, [selectedDate])

  const weekDays = useMemo(() => {
    const days: Date[] = []
    for (let i = -3; i <= 3; i++) {
      days.push(addDays(selectedDate, i))
    }
    return days
  }, [selectedDate])

  return {
    selectedDate,
    dayData,
    weekDays,
    goToNextDay,
    goToPrevDay,
    goToToday,
    goToDate,
  }
}
