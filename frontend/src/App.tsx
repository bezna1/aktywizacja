import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  AppBar,
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  LinearProgress,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Toolbar,
  Tab,
  Tabs,
  ToggleButton,
  useMediaQuery,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import {
  AccessTime,
  Add,
  AlarmOff,
  Assignment,
  BarChart,
  CalendarMonth,
  ChevronLeft,
  ChevronRight,
  Dashboard,
  Description,
  Edit,
  Error as ErrorIcon,
  EventBusy,
  Groups,
  History,
  Login,
  ManageAccounts,
  Palette,
  PersonOff,
  School,
  Search,
  Settings,
  TrendingUp,
  NotificationsNone,
  MoreHoriz,
  UploadFile,
  DeleteSweep,
  Warning,
} from '@mui/icons-material'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api'
const drawerWidth = 260

type MonthStat = { month: string; label: string; added: number; completed: number }

type DashboardData = {
  active_participants: number
  reserve_participants: number
  incomplete_participants: number
  upcoming_deadlines: number
  overdue_deadlines: number
  missing_attendance: number
  system_alerts: string[]
  recent_actions: { action: string; entity: string; entity_id: number | null; created_at: string }[]
  in_training_count: number
  completed_total: number
  completed_this_month: number
  resigned_total: number
  reserve_count: number
  completion_rate: number
  monthly_stats: MonthStat[]
  status_breakdown: Record<string, number>
}

type Participant = {
  id: number
  first_name: string | null
  last_name: string | null
  pesel: string | null
  birth_date: string | null
  phone: string | null
  voivodeship: string | null
  county: string | null
  commune: string | null
  city: string | null
  postal_code: string | null
  address: string | null
  pup_zus_status: string | null
  exclusion: string | null
  disability_status: string | null
  health_status: string | null
  life_situation: string | null
  age: number | null
  gender: string | null
  labor_market_status: string | null
  education: string | null
  notes: string | null
  status: string
  is_complete: boolean
  warning_reasons: string[]
  updated_at: string
  updated_by_name: string | null
  guardian: string | null
  version: number
}

type Training = {
  id: number
  name: string
  description: string | null
  instructor: string | null
  schedule: string | null
  hours_count: number
  status: string
  color: string | null
}

type ParticipantProfile = {
  participant: Participant
  trainings: {
    training_id: number
    training_name: string
    status: string
    start_date: string | null
    end_date: string | null
    attendance: string | null
    result: string | null
    notes: string | null
  }[]
  attendance: {
    date: string
    present: boolean
    hours: number
    notes: string | null
    program_type: string | null
  }[]
  documents: {
    name: string
    document_type: string
    is_required: boolean
    received_at: string | null
    file_path: string | null
  }[]
  programs: {
    program_type: string
    status: string
    planned_at: string | null
    completed_at: string | null
    notes: string | null
  }[]
}

type County = {
  id: number
  external_id: string
  name: string
  source: string
}

type AppUser = {
  id: number
  full_name: string
  email: string
  role: string
}

type ParticipantSortKey = 'warning' | 'name' | 'pesel' | 'phone' | 'status' | 'guardian' | 'updated_at'
type SortDirection = 'asc' | 'desc'

type ParticipantForm = {
  first_name: string
  last_name: string
  pesel: string
  birth_date: string
  phone: string
  voivodeship: string
  county: string
  commune: string
  city: string
  postal_code: string
  address: string
  status: string
  pup_zus_status: string
  exclusion: string
  disability_status: string
  health_status: string
  life_situation: string
  age: string
  gender: string
  labor_market_status: string
  education: string
  notes: string
  guardian: string
}

const emptyParticipant: ParticipantForm = {
  first_name: '',
  last_name: '',
  pesel: '',
  birth_date: '',
  phone: '',
  voivodeship: 'Dolnośląskie',
  county: '',
  commune: 'Legnickie Pole',
  city: '',
  postal_code: '',
  address: '',
  status: '',
  pup_zus_status: '',
  exclusion: '',
  disability_status: '',
  health_status: '',
  life_situation: '',
  age: '',
  gender: '',
  labor_market_status: '',
  education: '',
  notes: '',
  guardian: '',
}

const voivodeships = [
  'Dolnośląskie',
  'Kujawsko-pomorskie',
  'Lubelskie',
  'Lubuskie',
  'Łódzkie',
  'Małopolskie',
  'Mazowieckie',
  'Opolskie',
  'Podkarpackie',
  'Podlaskie',
  'Pomorskie',
  'Śląskie',
  'Świętokrzyskie',
  'Warmińsko-mazurskie',
  'Wielkopolskie',
  'Zachodniopomorskie',
]

const defaultCounty = 'powiat legnicki'
const legnicaCountyCommunes = [
  'Chojnów',
  'Chojnów - gmina wiejska',
  'Krotoszyce',
  'Kunice',
  'Legnickie Pole',
  'Miłkowice',
  'Prochowice',
  'Ruja',
]

const pupZusStatuses = ['PUP', 'ZUS', 'zarejestrowana/y w PUP', 'bierna/y zawodowo', 'pracująca/y', 'bezrobotna/y niezarejestrowana/y']
const genders = ['Kobieta', 'Mężczyzna', 'Inna', 'Brak danych']
const disabilityStatuses = ['Tak', 'Nie', 'Brak danych']
const healthStatuses = ['Dobry', 'Przeciętny', 'Wymaga wsparcia', 'Brak danych']
const lifeSituations = ['Samodzielna/y', 'Z rodziną', 'Samotna/y rodzic', 'Bezdomność', 'Inne']
const laborMarketStatuses = ['pracująca', 'bezrobotna', 'poszukująca pracy', 'bierna zawodowo']
const ageOptions = Array.from({ length: 83 }, (_, index) => String(index + 18))
const participantStatuses = [
  'Spóźniony',
  'W trakcie szkolenia',
  'Ukończył szkolenie',
  'Zrezygnował',
  'Przerwany udział',
  'Wymaga uzupełnienia danych',
]
const defaultStatusColors: Record<string, string> = {
  'Spóźniony': '#2e7d32',
  'W trakcie szkolenia': '#0288d1',
  'Ukończył szkolenie': '#2e7d32',
  'Zrezygnował': '#d32f2f',
  'Przerwany udział': '#d32f2f',
  'Wymaga uzupełnienia danych': '#ef6c00',
}
const educationLevels = ['Podstawowe', 'Gimnazjalne', 'Zasadnicze zawodowe', 'Średnie', 'Policealne', 'Wyższe']

const menuSections = [
  {
    title: 'GŁÓWNE',
    items: [
      ['Dashboard', <Dashboard fontSize="small" />],
      ['Uczestnicy', <Groups fontSize="small" />],
      ['Programy', <Assignment fontSize="small" />],
      ['Harmonogram', <CalendarMonth fontSize="small" />],
    ],
  },
  {
    title: 'SZKOLENIA',
    items: [
      ['Szkolenia', <School fontSize="small" />],
      ['Obecności', <TrendingUp fontSize="small" />],
      ['Dokumenty', <Description fontSize="small" />],
      ['Raporty', <BarChart fontSize="small" />],
    ],
  },
  {
    title: 'ADMINISTRACJA',
    items: [
      ['Użytkownicy', <ManageAccounts fontSize="small" />],
      ['Ustawienia', <Settings fontSize="small" />],
      ['Logi systemowe', <History fontSize="small" />],
    ],
  },
] as const

function validatePesel(pesel: string) {
  return /^\d{11}$/.test(pesel)
}

function getPeselError(pesel: string) {
  if (!pesel) return ''
  if (!/^\d+$/.test(pesel) || pesel.length !== 11) return 'PESEL musi mieć dokładnie 11 cyfr'
  return ''
}

function birthDateFromPesel(pesel: string) {
  if (!validatePesel(pesel)) return ''
  const year = Number(pesel.slice(0, 2))
  let month = Number(pesel.slice(2, 4))
  const day = Number(pesel.slice(4, 6))
  let century = 1900
  if (month >= 21 && month <= 32) {
    century = 2000
    month -= 20
  } else if (month >= 41 && month <= 52) {
    century = 2100
    month -= 40
  } else if (month >= 61 && month <= 72) {
    century = 2200
    month -= 60
  } else if (month >= 81 && month <= 92) {
    century = 1800
    month -= 80
  }
  return `${century + year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function validatePhone(phone: string) {
  return /^[+\d][\d\s-]{6,18}$/.test(phone)
}

function uniqueCountyNames(counties: County[]) {
  return [...new Set(counties.map((county) => county.name))].sort((a, b) => a.localeCompare(b, 'pl'))
}

function maskPesel(pesel: string | null) {
  if (!pesel) return '-'
  if (pesel.length <= 4) return '••••'
  return `${pesel.slice(0, 2)}•••••••${pesel.slice(-2)}`
}

function displayValue(value: string | null | undefined) {
  return value && value.trim().length > 0 ? value : 'Nieuzupełnione'
}

function textColorForBackground(hex: string) {
  const normalized = hex.replace('#', '')
  const full = normalized.length === 3
    ? normalized.split('').map((item) => `${item}${item}`).join('')
    : normalized
  const r = Number.parseInt(full.slice(0, 2), 16)
  const g = Number.parseInt(full.slice(2, 4), 16)
  const b = Number.parseInt(full.slice(4, 6), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 155 ? '#111111' : '#ffffff'
}

function communeOptionsForCounty(county: string) {
  if (county === 'powiat Legnica') return ['Legnica']
  if (county.toLowerCase() === 'powiat legnicki') return legnicaCountyCommunes
  return ['Legnica', ...legnicaCountyCommunes]
}

function participantSearchText(participant: Participant) {
  return [
    participant.first_name,
    participant.last_name,
    participant.pesel,
    participant.phone,
    participant.status,
    participant.county,
    participant.commune,
    participant.city,
    participant.guardian,
  ].filter(Boolean).join(' ').toLowerCase()
}

function participantSortValue(participant: Participant, key: ParticipantSortKey) {
  if (key === 'warning') return participant.warning_reasons.length > 0 ? 1 : 0
  if (key === 'name') return `${participant.last_name ?? ''} ${participant.first_name ?? ''}`.toLowerCase()
  if (key === 'updated_at') return new Date(participant.updated_at).getTime()
  return String(participant[key] ?? '').toLowerCase()
}

const HOUR_START = 6
const HOUR_END = 22
const ALL_HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i)

/** Parse "days:YYYY-MM-DD:hours;..." into a Record<dateKey, hours[]> */
function parseDayHours(schedule: string): Record<string, number[]> {
  const [dp] = schedule.split('|')
  const raw = dp?.trim() ?? ''
  if (!raw.startsWith('days:')) return {}
  const result: Record<string, number[]> = {}
  const content = raw.slice(5)
  const parts = content.includes(';') ? content.split(';') : content.split(',')
  for (const part of parts) {
    const colon = part.indexOf(':')
    if (colon === -1) {
      if (part.trim()) result[part.trim()] = []
    } else {
      const dateKey = part.slice(0, colon).trim()
      if (dateKey) result[dateKey] = decodeHours(part.slice(colon + 1))
    }
  }
  return result
}

/** Encode per-day hours map into schedule string */
function encodeDayHours(dayHours: Record<string, number[]>): string {
  const entries = Object.entries(dayHours).sort(([a], [b]) => a.localeCompare(b))
  return 'days:' + entries.map(([d, h]) => `${d}:${encodeHours(h)}`).join(';')
}

/** Get dates a training is active in a given month */
function trainingActiveDaysInMonth(training: Training, year: number, month: number): Set<string> {
  const result = new Set<string>()
  if (!training.schedule) return result
  const [dp] = training.schedule.split('|')
  const raw = dp?.trim() ?? ''
  if (raw.startsWith('days:')) {
    const content = raw.slice(5)
    const parts = content.includes(';') ? content.split(';') : content.split(',')
    for (const part of parts) {
      const dateKey = (part.includes(':') ? part.slice(0, part.indexOf(':')) : part).trim()
      const d = new Date(dateKey)
      if (!Number.isNaN(d.getTime()) && d.getFullYear() === year && d.getMonth() === month) result.add(dateKey)
    }
  } else {
    const parts = raw.split('/')
    const from = new Date(parts[0]?.trim() ?? '')
    const to = new Date(parts[1]?.trim() ?? '')
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return result
    const cur = new Date(Math.max(from.getTime(), new Date(year, month, 1).getTime()))
    const end = new Date(Math.min(to.getTime(), new Date(year, month + 1, 0).getTime()))
    while (cur <= end) { result.add(cur.toISOString().slice(0, 10)); cur.setDate(cur.getDate() + 1) }
  }
  return result
}

/** Encode a set of selected hours into contiguous range strings, e.g. [10,11,13,14] → "10-12,13-15" */
function encodeHours(hours: number[]): string {
  if (!hours.length) return ''
  const sorted = [...new Set(hours)].sort((a, b) => a - b)
  const ranges: string[] = []
  let start = sorted[0]
  let prev = sorted[0]
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === prev + 1) { prev = sorted[i]; continue }
    ranges.push(`${start}-${prev + 1}`)
    start = sorted[i]; prev = sorted[i]
  }
  ranges.push(`${start}-${prev + 1}`)
  return ranges.join(',')
}

/** Decode range strings into individual hours, e.g. "10-12,13-15" → [10,11,13,14] */
function decodeHours(s: string): number[] {
  if (!s.trim()) return []
  const hours: number[] = []
  for (const part of s.split(',')) {
    const [fromStr, toStr] = part.trim().split('-')
    const from = Number(fromStr)
    const to = Number(toStr)
    if (!Number.isNaN(from) && !Number.isNaN(to)) {
      for (let h = from; h < to; h++) hours.push(h)
    }
  }
  return hours
}

/** Build a human-readable label from selected hours, e.g. "10:00–12:00, 13:00–15:00" */
function hoursLabel(hours: number[]): string {
  if (!hours.length) return 'Brak zaznaczenia'
  const encoded = encodeHours(hours)
  return encoded.split(',').map((r) => {
    const [f, t] = r.split('-')
    return `${String(f).padStart(2, '0')}:00–${String(t).padStart(2, '0')}:00`
  }).join(', ')
}

function HourRangePicker({
  selectedHours,
  onChange,
}: {
  selectedHours: number[]
  onChange: (hours: number[]) => void
}) {
  const selectedSet = useMemo(() => new Set(selectedHours), [selectedHours])
  // dragMode: true = adding, false = removing
  const dragModeRef = useRef<boolean | null>(null)
  const dragStartRef = useRef<number | null>(null)
  const [previewRange, setPreviewRange] = useState<{ lo: number; hi: number } | null>(null)

  function handleMouseDown(h: number) {
    const adding = !selectedSet.has(h)
    dragModeRef.current = adding
    dragStartRef.current = h
    setPreviewRange({ lo: h, hi: h })
  }

  function handleMouseEnter(h: number) {
    if (dragStartRef.current === null) return
    const lo = Math.min(dragStartRef.current, h)
    const hi = Math.max(dragStartRef.current, h)
    setPreviewRange({ lo, hi })
  }

  function commit(h: number) {
    if (dragStartRef.current === null || dragModeRef.current === null) return
    const lo = Math.min(dragStartRef.current, h)
    const hi = Math.max(dragStartRef.current, h)
    const rangeHours = ALL_HOURS.filter((hour) => hour >= lo && hour <= hi)
    let next: number[]
    if (dragModeRef.current) {
      next = [...new Set([...selectedHours, ...rangeHours])]
    } else {
      const remove = new Set(rangeHours)
      next = selectedHours.filter((hour) => !remove.has(hour))
    }
    onChange(next.sort((a, b) => a - b))
    dragStartRef.current = null
    dragModeRef.current = null
    setPreviewRange(null)
  }

  function cellState(h: number): 'selected' | 'adding' | 'removing' | 'idle' {
    const inPreview = previewRange !== null && h >= previewRange.lo && h <= previewRange.hi
    const isSelected = selectedSet.has(h)
    if (inPreview && dragModeRef.current === true) return isSelected ? 'selected' : 'adding'
    if (inPreview && dragModeRef.current === false) return 'removing'
    return isSelected ? 'selected' : 'idle'
  }

  const label = hoursLabel(selectedHours)

  return (
    <Box
      onMouseLeave={() => { dragStartRef.current = null; dragModeRef.current = null; setPreviewRange(null) }}
      onMouseUp={(e) => { if (previewRange) commit(previewRange.hi); e.preventDefault() }}
      sx={{ userSelect: 'none' }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">Godziny zajęć</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: '#1976d2' }} />
            <Typography variant="caption" color="text.secondary">zaznaczono · kliknij lub przeciągnij</Typography>
          </Box>
          {selectedHours.length > 0 && (
            <Typography
              variant="caption"
              color="error"
              sx={{ cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => onChange([])}
            >
              wyczyść
            </Typography>
          )}
        </Stack>
      </Stack>

      {/* Ruler */}
      <Box sx={{ display: 'flex', gap: '2px', mb: '2px' }}>
        {ALL_HOURS.map((h) => (
          <Typography
            key={h}
            variant="caption"
            sx={{ flex: 1, textAlign: 'center', fontSize: 9, color: 'text.disabled', lineHeight: 1 }}
          >
            {h}
          </Typography>
        ))}
      </Box>

      {/* Hour cells */}
      <Box sx={{ display: 'flex', gap: '2px', cursor: 'crosshair' }}>
        {ALL_HOURS.map((h) => {
          const state = cellState(h)
          const bgColor = state === 'selected' ? '#1976d2'
            : state === 'adding' ? '#64b5f6'
            : state === 'removing' ? '#ef9a9a'
            : '#eeeeee'
          const borderColor = state === 'selected' ? '#1565c0'
            : state === 'adding' ? '#42a5f5'
            : state === 'removing' ? '#e57373'
            : '#e0e0e0'
          return (
            <Box
              key={h}
              onMouseDown={(e) => { e.preventDefault(); handleMouseDown(h) }}
              onMouseEnter={() => handleMouseEnter(h)}
              sx={{
                flex: 1,
                height: 28,
                borderRadius: '4px',
                bgcolor: bgColor,
                border: `1px solid ${borderColor}`,
                transition: 'background-color 0.08s',
                '&:hover': { opacity: 0.85 },
              }}
            />
          )
        })}
      </Box>

      {/* Label row */}
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
        <Typography variant="caption" sx={{ fontSize: 9, color: 'text.disabled' }}>{HOUR_START}:00</Typography>
        <Typography variant="body2" fontWeight={700} color={selectedHours.length > 0 ? 'primary' : 'text.disabled'}>
          {label}
        </Typography>
        <Typography variant="caption" sx={{ fontSize: 9, color: 'text.disabled' }}>{HOUR_END}:00</Typography>
      </Stack>
    </Box>
  )
}

const WEEKDAY_SHORT = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb']
const MONTH_NAMES = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień']

function DayPickerCalendar({
  dayHours,
  activeDay,
  onDayClick,
  initialDate,
}: {
  dayHours: Record<string, number[]>
  activeDay: string | null
  onDayClick: (day: string) => void
  initialDate?: string
}) {
  const firstKey = Object.keys(dayHours).sort()[0] ?? initialDate
  const [viewYear, setViewYear] = useState(() => {
    const d = firstKey ? new Date(firstKey) : new Date()
    return Number.isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear()
  })
  const [viewMonth, setViewMonth] = useState(() => {
    const d = firstKey ? new Date(firstKey) : new Date()
    return Number.isNaN(d.getTime()) ? new Date().getMonth() : d.getMonth()
  })

  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const totalDays = Object.keys(dayHours).length
  const totalHours = Object.values(dayHours).reduce((s, h) => s + h.length, 0)

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11) } else setViewMonth(viewMonth - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0) } else setViewMonth(viewMonth + 1)
  }

  const firstDay = new Date(viewYear, viewMonth, 1)
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells: (string | null)[] = Array(startOffset).fill(null)
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
  }
  while (cells.length % 7 !== 0) cells.push(null)

  const weekendCols = new Set([5, 6])

  return (
    <Box sx={{ userSelect: 'none' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
        <IconButton size="small" onClick={prevMonth}><ChevronLeft fontSize="small" /></IconButton>
        <Typography variant="caption" fontWeight={700} sx={{ minWidth: 130, textAlign: 'center' }}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </Typography>
        <IconButton size="small" onClick={nextMonth}><ChevronRight fontSize="small" /></IconButton>
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', mb: '3px' }}>
        {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'].map((d, i) => (
          <Typography key={d} variant="caption" align="center" sx={{ fontSize: 9, fontWeight: 700, color: weekendCols.has(i) ? '#ef5350' : 'text.disabled' }}>
            {d}
          </Typography>
        ))}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
        {cells.map((key, i) => {
          if (!key) return <Box key={i} sx={{ height: 44 }} />
          const dayNum = Number(key.slice(8))
          const isWeekend = weekendCols.has(i % 7)
          const isActive = key === activeDay
          const hasHours = key in dayHours
          const dayH = dayHours[key]?.length ?? 0
          const isToday = key === today
          const weekdayLabel = WEEKDAY_SHORT[new Date(key).getDay()]
          return (
            <Box
              key={key}
              onClick={() => onDayClick(key)}
              title={`${weekdayLabel} — kliknij aby edytować godziny`}
              sx={{
                height: 44,
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1px',
                bgcolor: isActive ? '#e8f5e9' : hasHours ? '#f1f8e9' : isToday ? '#e3f2fd' : 'transparent',
                border: isActive ? '2px solid #2e7d32' : hasHours ? '1.5px solid #a5d6a7' : isToday ? '1.5px solid #90caf9' : '1.5px solid transparent',
                '&:hover': { bgcolor: isActive ? '#c8e6c9' : '#f0f4ff' },
                transition: 'background-color 0.1s',
              }}
            >
              <Typography sx={{ fontSize: 12, fontWeight: hasHours ? 700 : 400, lineHeight: 1.2, color: isActive ? '#1b5e20' : isWeekend ? '#ef5350' : isToday ? '#1976d2' : 'text.primary' }}>
                {dayNum}
              </Typography>
              <Typography sx={{ fontSize: 7, lineHeight: 1, color: isActive ? '#2e7d32' : hasHours ? '#558b2f' : 'text.disabled' }}>
                {isActive ? `${dayH}h ✓` : hasHours ? `${dayH}h` : weekdayLabel}
              </Typography>
            </Box>
          )
        })}
      </Box>

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 0.75 }}>
        <Typography variant="caption" color={totalDays > 0 ? 'success.main' : 'text.secondary'} fontWeight={totalDays > 0 ? 700 : 400}>
          {totalDays > 0 ? `${totalDays} dni · ${totalHours} h łącznie` : 'Kliknij dzień aby ustawić godziny'}
        </Typography>
        {totalDays > 0 && (
          <Typography variant="caption" color="error" sx={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => onDayClick('__clear__')}>
            wyczyść wszystko
          </Typography>
        )}
      </Stack>
    </Box>
  )
}

function HourTimeline({ trainings, day }: { trainings: Training[]; day: string }) {
  const hours = ALL_HOURS
  const rows = trainings.map((t) => {
    const [, tp] = (t.schedule ?? '').split('|')
    const raw = t.schedule ?? ''
    let hrs: Set<number>
    if (raw.startsWith('days:') || raw.includes(';')) {
      hrs = new Set(parseDayHours(raw)[day] ?? [])
    } else {
      hrs = new Set(decodeHours((tp ?? '').trim()))
    }
    return { t, hrs }
  }).filter((r) => r.hrs.size > 0)

  if (rows.length === 0) return <Typography color="text.secondary" variant="body2">Brak godzin szkoleniowych w tym dniu.</Typography>

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Box sx={{ display: 'flex', pl: '160px', gap: '2px', mb: '3px', minWidth: 500 }}>
        {hours.map((h) => (
          <Typography key={h} variant="caption" sx={{ flex: 1, textAlign: 'center', fontSize: 9, color: 'text.disabled', minWidth: 18 }}>{h}</Typography>
        ))}
      </Box>
      {rows.map(({ t, hrs }) => (
        <Stack key={t.id} direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5, minWidth: 500 }}>
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ width: 160, flexShrink: 0 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: t.color ?? '#9e9e9e', flexShrink: 0 }} />
            <Typography variant="caption" fontWeight={600} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</Typography>
          </Stack>
          <Box sx={{ flex: 1, display: 'flex', gap: '2px' }}>
            {hours.map((h) => (
              <Box key={h} sx={{ flex: 1, minWidth: 18, height: 22, borderRadius: '3px', bgcolor: hrs.has(h) ? (t.color ?? '#1976d2') : '#f0f0f0', opacity: hrs.has(h) ? 0.9 : 1 }} />
            ))}
          </Box>
        </Stack>
      ))}
    </Box>
  )
}

function HarmonogramView({ trainings }: { trainings: Training[] }) {
  const [viewYear, setViewYear] = useState(new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(new Date().getMonth())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const dayMap = useMemo(() => {
    const map: Record<string, Training[]> = {}
    for (const t of trainings) {
      trainingActiveDaysInMonth(t, viewYear, viewMonth).forEach((d) => {
        if (!map[d]) map[d] = []
        map[d].push(t)
      })
    }
    return map
  }, [trainings, viewYear, viewMonth])

  function goMonth(delta: number) {
    const d = new Date(viewYear, viewMonth + delta, 1)
    setViewYear(d.getFullYear()); setViewMonth(d.getMonth())
    setSelectedDay(null)
  }

  const firstDay = new Date(viewYear, viewMonth, 1)
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells: (string | null)[] = Array(startOffset).fill(null)
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
  }
  while (cells.length % 7 !== 0) cells.push(null)

  const weekendCols = new Set([5, 6])
  const selectedTrainings = selectedDay ? (dayMap[selectedDay] ?? []) : []

  return (
    <Stack spacing={2}>
      <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1.5, bgcolor: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
          <IconButton size="small" onClick={() => goMonth(-1)}><ChevronLeft /></IconButton>
          <Typography variant="h6" fontWeight={800}>{MONTH_NAMES[viewMonth]} {viewYear}</Typography>
          <IconButton size="small" onClick={() => goMonth(1)}><ChevronRight /></IconButton>
        </Stack>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #e0e0e0' }}>
          {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'].map((d, i) => (
            <Typography key={d} align="center" sx={{ py: 0.75, fontSize: 11, fontWeight: 700, color: weekendCols.has(i) ? '#ef5350' : 'text.secondary' }}>{d}</Typography>
          ))}
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', bgcolor: '#e0e0e0' }}>
          {cells.map((key, i) => {
            if (!key) return <Box key={i} sx={{ minHeight: 90, bgcolor: '#fafafa' }} />
            const dayNum = Number(key.slice(8))
            const isWeekend = weekendCols.has(i % 7)
            const isSelected = key === selectedDay
            const isToday = key === today
            const dayTrainings = dayMap[key] ?? []
            const wday = WEEKDAY_SHORT[new Date(key).getDay()]
            return (
              <Box key={key} onClick={() => setSelectedDay(isSelected ? null : key)} sx={{
                minHeight: 90, p: 0.5, cursor: 'pointer',
                bgcolor: isSelected ? '#e3f2fd' : isWeekend ? '#fff8f8' : '#fff',
                borderTop: isSelected ? '3px solid #1976d2' : '3px solid transparent',
                '&:hover': { bgcolor: isSelected ? '#bbdefb' : '#f5f5f5' },
              }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box sx={{ width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: isToday ? '#1976d2' : 'transparent' }}>
                    <Typography sx={{ fontSize: 11, fontWeight: isToday ? 800 : 500, color: isToday ? '#fff' : isWeekend ? '#ef5350' : 'text.primary' }}>{dayNum}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: 8, color: 'text.disabled', mt: 0.25 }}>{wday}</Typography>
                </Stack>
                <Stack spacing={0.25} sx={{ mt: 0.5 }}>
                  {dayTrainings.slice(0, 2).map((t) => (
                    <Box key={t.id} sx={{ px: 0.5, py: '1px', borderRadius: 0.5, bgcolor: (t.color ?? '#9e9e9e') + '25', borderLeft: `3px solid ${t.color ?? '#9e9e9e'}` }}>
                      <Typography sx={{ fontSize: 9, fontWeight: 600, color: t.color ?? '#555', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{t.name}</Typography>
                    </Box>
                  ))}
                  {dayTrainings.length > 2 && <Typography sx={{ fontSize: 9, color: 'text.disabled', pl: 0.5 }}>+{dayTrainings.length - 2}</Typography>}
                </Stack>
              </Box>
            )
          })}
        </Box>
      </Paper>

      {selectedDay && (
        <Paper elevation={0} sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <Typography variant="h6" fontWeight={800}>
              {Number(selectedDay.slice(8))}.{selectedDay.slice(5, 7)}.{selectedDay.slice(0, 4)},
              {' '}{WEEKDAY_SHORT[new Date(selectedDay).getDay()]}
            </Typography>
            <Chip label={selectedTrainings.length === 0 ? 'brak szkoleń' : `${selectedTrainings.length} szkoleń`} size="small" />
          </Stack>
          <Divider sx={{ mb: 1.5 }} />
          <HourTimeline trainings={selectedTrainings} day={selectedDay} />
        </Paper>
      )}
    </Stack>
  )
}

function countWeekdays(from: string, to: string): number {
  const start = new Date(from)
  const end = new Date(to)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0
  let count = 0
  const cur = new Date(start)
  while (cur <= end) {
    const day = cur.getDay()
    if (day !== 0 && day !== 6) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') ?? '')
  const [view, setView] = useState('Dashboard')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [trainings, setTrainings] = useState<Training[]>([])
  const [counties, setCounties] = useState<County[]>([])
  const [appUsers, setAppUsers] = useState<AppUser[]>([])
  const [openForm, setOpenForm] = useState(false)
  const [form, setForm] = useState<ParticipantForm>(emptyParticipant)
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null)
  const [openProfile, setOpenProfile] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profile, setProfile] = useState<ParticipantProfile | null>(null)
  const [profileTab, setProfileTab] = useState(0)
  const isMobile = useMediaQuery('(max-width: 899px)')
  const [openStatusColors, setOpenStatusColors] = useState(false)
  const [statusColors, setStatusColors] = useState<Record<string, string>>(() => {
    const raw = localStorage.getItem('statusColors')
    if (!raw) return defaultStatusColors
    try {
      return { ...defaultStatusColors, ...JSON.parse(raw) }
    } catch {
      return defaultStatusColors
    }
  })
  const [loginData, setLoginData] = useState({ email: 'admin@local.test', password: 'Admin123!' })
  const [openTrainingForm, setOpenTrainingForm] = useState(false)
  const [editingTraining, setEditingTraining] = useState<Training | null>(null)
  const [trainingForm, setTrainingForm] = useState({ name: '', instructor: '', description: '', schedule_mode: 'range' as 'range' | 'days', schedule_from: '', schedule_to: '', day_hours: {} as Record<string, number[]>, active_day: null as string | null, selected_hours: [] as number[], hours_count: '', status: 'aktywne', color: '' })
  const [bootstrapResult, setBootstrapResult] = useState<string | null>(null)
  const [trainingToAssign, setTrainingToAssign] = useState<Training | null>(null)
  const [participantFilter, setParticipantFilter] = useState('all')

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token])
  const availableStatuses = useMemo(
    () => [...new Set([...participantStatuses, ...participants.map((participant) => participant.status)])].sort((a, b) => a.localeCompare(b, 'pl')),
    [participants],
  )

  async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? headers : {}),
        ...options.headers,
      },
    })
    if (!response.ok) throw new Error(await response.text())
    return response.json()
  }

  function participantPayload() {
    return {
      first_name: form.first_name || null,
      last_name: form.last_name || null,
      pesel: form.pesel || null,
      birth_date: form.birth_date || null,
      phone: form.phone || null,
      voivodeship: form.voivodeship || null,
      county: form.county || null,
      commune: form.commune || null,
      city: form.city || null,
      postal_code: form.postal_code || null,
      address: form.address || null,
      status: form.status || null,
      pup_zus_status: form.pup_zus_status || null,
      exclusion: form.exclusion || null,
      disability_status: form.disability_status || null,
      health_status: form.health_status || null,
      life_situation: form.life_situation || null,
      age: form.age ? Number(form.age) : null,
      gender: form.gender || null,
      labor_market_status: form.labor_market_status || null,
      education: form.education || null,
      notes: form.notes || null,
      guardian: form.guardian || null,
      ...(editingParticipant ? { version: editingParticipant.version } : {}),
    }
  }

  function readableError(err: unknown, fallback: string) {
    if (!(err instanceof Error)) return fallback
    try {
      const parsed = JSON.parse(err.message)
      if (typeof parsed.detail === 'string') return parsed.detail
      if (parsed.detail?.detail) return parsed.detail.detail
      if (parsed.detail?.message) return parsed.detail.message
      if (Array.isArray(parsed.detail)) return parsed.detail.map((item: { msg?: string }) => item.msg).filter(Boolean).join(', ')
    } catch {
      return err.message
    }
    return fallback
  }

  async function loadData() {
    if (!token) return
    setLoading(true)
    setError('')
    try {
      const [dash, people, trainingList, countyList, userList] = await Promise.all([
        request<DashboardData>('/dashboard'),
        request<Participant[]>('/participants'),
        request<Training[]>('/trainings'),
        request<County[]>('/dictionaries/counties'),
        request<AppUser[]>('/auth/users'),
      ])
      setDashboard(dash)
      setParticipants(people)
      setTrainings(trainingList)
      setCounties(countyList)
      setAppUsers(userList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd połączenia z API')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initial API synchronization after login/token restore.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  async function signIn() {
    setLoading(true)
    setError('')
    try {
      const body = new URLSearchParams()
      body.set('username', loginData.email)
      body.set('password', loginData.password)
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      if (!response.ok) throw new Error('Nieprawidłowy login lub hasło')
      const data = await response.json()
      localStorage.setItem('token', data.access_token)
      setToken(data.access_token)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd logowania')
    } finally {
      setLoading(false)
    }
  }

  async function createParticipant() {
    setLoading(true)
    setError('')
    try {
      const saved = await request<Participant>(editingParticipant ? `/participants/${editingParticipant.id}` : '/participants', {
        method: editingParticipant ? 'PUT' : 'POST',
        body: JSON.stringify(participantPayload()),
      })
      if (trainingToAssign) {
        try {
          await request('/trainings/assign', {
            method: 'POST',
            body: JSON.stringify({ participant_id: saved.id, training_id: trainingToAssign.id }),
          })
        } catch {
          // Ignore assign errors (already assigned, incomplete data etc.)
        }
      }
      setOpenForm(false)
      setEditingParticipant(null)
      setForm(emptyParticipant)
      setTrainingToAssign(null)
      await loadData()
    } catch (err) {
      setError(readableError(err, 'Nie udało się zapisać uczestnika'))
    } finally {
      setLoading(false)
    }
  }

  function openParticipantForm(participant?: Participant) {
    if (!participant) {
      setEditingParticipant(null)
      setForm({ ...emptyParticipant, county: defaultCounty })
      setOpenForm(true)
      return
    }
    setEditingParticipant(participant)
    setForm({
      first_name: participant.first_name ?? '',
      last_name: participant.last_name ?? '',
      pesel: participant.pesel ?? '',
      birth_date: participant.birth_date ?? '',
      phone: participant.phone ?? '',
      voivodeship: participant.voivodeship ?? 'Dolnośląskie',
      county: participant.county ?? defaultCounty,
      commune: participant.commune ?? '',
      city: participant.city ?? '',
      postal_code: participant.postal_code ?? '',
      address: participant.address ?? '',
      status: participant.status ?? '',
      pup_zus_status: participant.pup_zus_status ?? '',
      exclusion: participant.exclusion ?? '',
      disability_status: participant.disability_status ?? '',
      health_status: participant.health_status ?? '',
      life_situation: participant.life_situation ?? '',
      age: participant.age ? String(participant.age) : '',
      gender: participant.gender ?? '',
      labor_market_status: participant.labor_market_status ?? '',
      education: participant.education ?? '',
      notes: participant.notes ?? '',
      guardian: participant.guardian ?? '',
    })
    setOpenForm(true)
  }

  async function importFile(file: File) {
    const body = new FormData()
    body.append('file', file)
    setLoading(true)
    setError('')
    try {
      await request('/import/xlsx', { method: 'POST', body })
      await loadData()
      setView('Uczestnicy')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import nie powiódł się')
    } finally {
      setLoading(false)
    }
  }

  async function openParticipantProfile(participant: Participant) {
    setOpenProfile(true)
    setProfileLoading(true)
    setError('')
    try {
      const data = await request<ParticipantProfile>(`/participants/${participant.id}/profile`)
      setProfile(data)
    } catch (err) {
      setProfile(null)
      setError(readableError(err, 'Nie udało się pobrać profilu uczestnika'))
    } finally {
      setProfileLoading(false)
    }
  }

  async function toggleAttendance(participantId: number, isoDate: string, programType: string, currentPresent: boolean | null) {
    // Cycle: null → true → false → null
    const nextPresent: boolean | null = currentPresent === null ? true : currentPresent === true ? false : null
    const matchKey = (a: { date: string; program_type: string | null }) =>
      a.date === isoDate && (a.program_type ?? '') === (programType ?? '')
    setProfile((prev) => {
      if (!prev) return prev
      if (nextPresent === null) {
        return { ...prev, attendance: prev.attendance.filter((a) => !matchKey(a)) }
      }
      const existing = prev.attendance.find(matchKey)
      if (existing) {
        return { ...prev, attendance: prev.attendance.map((a) => matchKey(a) ? { ...a, present: nextPresent } : a) }
      }
      return { ...prev, attendance: [...prev.attendance, { date: isoDate, present: nextPresent, hours: 0, notes: null, program_type: programType }] }
    })
    try {
      if (nextPresent === null) {
        const qs = programType ? `?date=${isoDate}&program_type=${encodeURIComponent(programType)}` : `?date=${isoDate}`
        await request(`/participants/${participantId}/attendance${qs}`, { method: 'DELETE' })
      } else {
        await request(`/participants/${participantId}/attendance`, {
          method: 'PUT',
          body: JSON.stringify({ date: isoDate, present: nextPresent, hours: 0, program_type: programType || null }),
        })
      }
    } catch {
      setProfile((prev) => {
        if (!prev) return prev
        if (currentPresent === null) {
          return { ...prev, attendance: prev.attendance.filter((a) => !matchKey(a)) }
        }
        if (nextPresent === null) {
          return { ...prev, attendance: [...prev.attendance, { date: isoDate, present: currentPresent, hours: 0, notes: null, program_type: programType }] }
        }
        return { ...prev, attendance: prev.attendance.map((a) => matchKey(a) ? { ...a, present: currentPresent } : a) }
      })
    }
  }

  async function purgeParticipants() {
    const confirmed = window.confirm('To usunie wszystkich uczestników i powiązane dane. Kontynuować?')
    if (!confirmed) return
    setLoading(true)
    setError('')
    try {
      await request<{ status: string; deleted_participants: number }>('/participants/purge', { method: 'DELETE' })
      await loadData()
      setView('Uczestnicy')
    } catch (err) {
      setError(readableError(err, 'Nie udało się wyczyścić bazy uczestników'))
    } finally {
      setLoading(false)
    }
  }

  function openTrainingEdit(training: Training) {
    setEditingTraining(training)
    // Format: "YYYY-MM-DD / YYYY-MM-DD | HH-HH"
    const [datePart, timePart] = (training.schedule ?? '').split('|')
    const dp = (datePart ?? '').trim()
    const isDaysMode = dp.startsWith('days:')
    const dateParts = isDaysMode ? ['', ''] : dp.split('/')
    const parsed = isDaysMode ? parseDayHours(training.schedule ?? '') : {}
    setTrainingForm({
      name: training.name,
      instructor: training.instructor ?? '',
      description: training.description ?? '',
      schedule_mode: isDaysMode ? 'days' : 'range',
      schedule_from: dateParts[0]?.trim() ?? '',
      schedule_to: dateParts[1]?.trim() ?? '',
      day_hours: parsed,
      active_day: null,
      selected_hours: isDaysMode ? [] : decodeHours((timePart ?? '').trim()),
      hours_count: String(training.hours_count),
      status: training.status,
      color: training.color ?? '',
    })
    setOpenTrainingForm(true)
  }

  async function saveTraining() {
    if (!editingTraining) return
    setLoading(true)
    setError('')
    let schedule: string | null
    if (trainingForm.schedule_mode === 'days') {
      schedule = Object.keys(trainingForm.day_hours).length > 0 ? encodeDayHours(trainingForm.day_hours) : null
    } else {
      const encodedHours = encodeHours(trainingForm.selected_hours)
      const timePart = encodedHours ? ` | ${encodedHours}` : ''
      const datePart = trainingForm.schedule_from && trainingForm.schedule_to
        ? `${trainingForm.schedule_from} / ${trainingForm.schedule_to}`
        : trainingForm.schedule_from || trainingForm.schedule_to || ''
      schedule = (datePart + timePart) || null
    }
    try {
      await request<Training>(`/trainings/${editingTraining.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: trainingForm.name,
          instructor: trainingForm.instructor || null,
          description: trainingForm.description || null,
          schedule,
          hours_count: Number(trainingForm.hours_count) || 0,
          status: trainingForm.status,
          color: trainingForm.color || null,
        }),
      })
      setOpenTrainingForm(false)
      setEditingTraining(null)
      await loadData()
    } catch (err) {
      setError(readableError(err, 'Nie udało się zapisać szkolenia'))
    } finally {
      setLoading(false)
    }
  }

  async function bootstrapTrainings() {
    setLoading(true)
    setError('')
    setBootstrapResult(null)
    try {
      const res = await request<{ status: string; created_trainings: number; assigned_participants: number }>('/trainings/bootstrap', { method: 'POST' })
      await loadData()
      setView('Szkolenia')
      setBootstrapResult(`Utworzono ${res.created_trainings} szkoleń, przypisano ${res.assigned_participants} uczestników.`)
    } catch (err) {
      setError(readableError(err, 'Nie udało się utworzyć szkoleń i przypisać uczestników'))
    } finally {
      setLoading(false)
    }
  }

  function updateStatusColor(status: string, color: string) {
    const next = { ...statusColors, [status]: color }
    setStatusColors(next)
    localStorage.setItem('statusColors', JSON.stringify(next))
  }

  function resetStatusColors() {
    setStatusColors(defaultStatusColors)
    localStorage.setItem('statusColors', JSON.stringify(defaultStatusColors))
  }

  const formErrors = {
    pesel: Boolean(getPeselError(form.pesel)),
    phone: form.phone.length > 0 && !validatePhone(form.phone),
  }
  const countyOptions = useMemo(() => uniqueCountyNames(counties), [counties])

  function updateFormField(key: keyof ParticipantForm, value: string) {
    if (key === 'pesel') {
      const pesel = value.replace(/\D/g, '').slice(0, 11)
      const birthDate = birthDateFromPesel(pesel)
      setForm({ ...form, pesel, birth_date: birthDate || form.birth_date })
      return
    }
    setForm({ ...form, [key]: value })
  }

  function renderTextField(key: keyof ParticipantForm, label: string, required = true) {
    const peselHelperText = key === 'pesel' ? getPeselError(form.pesel) || 'Format: 11 cyfr, np. 44051401458' : ''
    const isMissing = required && !form[key]
    return (
      <TextField
        key={key}
        label={label}
        type={key === 'birth_date' ? 'date' : 'text'}
        value={form[key]}
        onChange={(event) => updateFormField(key, event.target.value)}
        slotProps={key === 'birth_date' ? { inputLabel: { shrink: true } } : undefined}
        required={required}
        error={isMissing || (key === 'pesel' && formErrors.pesel) || (key === 'phone' && formErrors.phone)}
        helperText={isMissing ? 'Pole wymagane' : peselHelperText || (key === 'phone' && formErrors.phone ? 'Nieprawidłowy telefon' : '')}
        multiline={key === 'notes'}
      />
    )
  }

  function renderDropdown(key: keyof ParticipantForm, label: string, options: string[], allowFreeText = false) {
    return (
      <Autocomplete
        key={key}
        freeSolo={allowFreeText}
        selectOnFocus={allowFreeText}
        handleHomeEndKeys={allowFreeText}
        options={options}
        value={form[key]}
        onInputChange={(_, value, reason) => {
          if (allowFreeText && ['input', 'clear'].includes(reason)) {
            setForm({ ...form, [key]: value })
          }
        }}
        onChange={(_, value) => {
          if (key === 'county' && value === 'powiat Legnica') {
            setForm({ ...form, county: value, commune: 'Legnica', city: 'Legnica' })
            return
          }
          if (key === 'county' && value?.toLowerCase() === 'powiat legnicki') {
            setForm({ ...form, county: value, commune: form.commune === 'Legnica' ? 'Legnickie Pole' : form.commune })
            return
          }
          setForm({ ...form, [key]: value ?? '' })
        }}
        renderInput={(params) => <TextField {...params} label={label} required />}
      />
    )
  }

  if (!token) {
    return (
      <Box className="loginScreen">
        <Paper className="loginPanel" elevation={0}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>System aktywizacji</Typography>
          <Typography color="text.secondary">Logowanie użytkownika</Typography>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="E-mail" value={loginData.email} onChange={(event) => setLoginData({ ...loginData, email: event.target.value })} />
          <TextField label="Hasło" type="password" value={loginData.password} onChange={(event) => setLoginData({ ...loginData, password: event.target.value })} />
          <Button size="large" variant="contained" startIcon={<Login />} onClick={signIn} disabled={loading}>
            Zaloguj
          </Button>
        </Paper>
      </Box>
    )
  }

  const allNav = ['Dashboard', 'Uczestnicy', 'Programy', 'Harmonogram', 'Szkolenia', 'Obecności', 'Dokumenty', 'Raporty', 'Użytkownicy', 'Ustawienia', 'Logi systemowe']

  return (
    <Box className="appShell">
      {/* ── Top navigation ─────────────────────────────── */}
      <Box className="topNav">
        {/* Row 1: Logo + Actions */}
        <Box className="navRow1">
          <Box className="navLogo">
            <Box className="brandIcon">A</Box>
            <Typography sx={{ fontWeight: 800, fontSize: 15, color: '#1A1A1A', letterSpacing: '-0.3px' }}>
              Aktywizacja
            </Typography>
          </Box>
          <Box className="navActions">
          <Button
            variant="contained"
            size="small"
            startIcon={<Add fontSize="small" />}
            onClick={() => openParticipantForm()}
            sx={{ borderRadius: '100px', textTransform: 'none', fontWeight: 700, fontSize: 13, px: 2, bgcolor: '#1A1A1A', '&:hover': { bgcolor: '#333' }, boxShadow: 'none' }}
          >
            Dodaj
          </Button>
          <Button
            component="label"
            size="small"
            sx={{ borderRadius: '100px', textTransform: 'none', fontSize: 13, color: '#555', minWidth: 0, px: 1.5 }}
          >
            <UploadFile fontSize="small" />
            <input hidden type="file" accept=".xlsx" onChange={(e) => e.target.files?.[0] && importFile(e.target.files[0])} />
          </Button>
          <IconButton size="small" onClick={() => setOpenStatusColors(true)} sx={{ color: '#888' }}>
            <Palette fontSize="small" />
          </IconButton>
          <IconButton size="small" sx={{ color: '#888' }}>
            <Search fontSize="small" />
          </IconButton>
          <IconButton size="small" sx={{ color: '#888' }}>
            <NotificationsNone fontSize="small" />
          </IconButton>
          <Box
            onClick={() => { localStorage.removeItem('token'); setToken('') }}
            sx={{ width: 34, height: 34, borderRadius: '50%', bgcolor: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', ml: 0.5 }}
          >
            A
          </Box>
          </Box>{/* end navActions */}
        </Box>{/* end navRow1 */}

        {/* Row 2: Nav tabs — wrap to next line */}
        <Box className="navRow2">
          {allNav.map((label) => (
            <Box
              key={label}
              className={`navTab${view === label ? ' active' : ''}`}
              onClick={() => setView(label)}
            >
              {label}
            </Box>
          ))}
        </Box>
      </Box>{/* end topNav */}

      {loading && <LinearProgress sx={{ position: 'sticky', top: 0, zIndex: 200 }} />}

      {/* ── Page content ───────────────────────────────── */}
      <Box className="content">
        {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
        {view === 'Dashboard' && <DashboardView dashboard={dashboard} onNavigate={(target, filter) => { setParticipantFilter(filter ?? 'all'); setView(target) }} />}
        {view === 'Uczestnicy' && <ParticipantsView participants={participants} onEdit={openParticipantForm} onOpenProfile={openParticipantProfile} statusColors={statusColors} appUsers={appUsers} initialStatusFilter={participantFilter} />}
        {view === 'Szkolenia' && (
          <Stack spacing={2}>
            {bootstrapResult && <Alert severity="success" onClose={() => setBootstrapResult(null)}>{bootstrapResult}</Alert>}
            <TrainingsView trainings={trainings} onBootstrap={bootstrapTrainings} onEdit={openTrainingEdit} />
          </Stack>
        )}
        {view === 'Harmonogram' && <HarmonogramView trainings={trainings} />}
        {!['Dashboard', 'Uczestnicy', 'Szkolenia', 'Harmonogram'].includes(view) && <PlaceholderView title={view} />}
      </Box>

      <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingParticipant ? 'Edytuj uczestnika' : 'Dodaj uczestnika'}</DialogTitle>
        <DialogContent>
          <Box className="participantForm">
            {renderTextField('first_name', 'Imię')}
            {renderTextField('last_name', 'Nazwisko')}
            {renderTextField('pesel', 'PESEL')}
            {renderTextField('birth_date', 'Data urodzenia')}
            {renderTextField('phone', 'Telefon')}
            {renderDropdown('voivodeship', 'Województwo', voivodeships)}
            {renderDropdown('county', 'Powiat', countyOptions)}
            {renderDropdown('commune', 'Gmina', communeOptionsForCounty(form.county), true)}
            {renderTextField('city', 'Miejscowość')}
            {renderTextField('postal_code', 'Kod pocztowy')}
            {renderTextField('address', 'Adres')}
            {renderTextField('exclusion', 'Wykluczenie')}
            {renderDropdown('age', 'Wiek', ageOptions)}
            {renderDropdown('disability_status', 'Niepełnosprawność', disabilityStatuses)}
            {renderDropdown('health_status', 'Zdrowotne', healthStatuses)}
            {renderDropdown('life_situation', 'Sytuacja życiowa', lifeSituations, true)}
            {renderDropdown('gender', 'Płeć', genders)}
            {renderDropdown('labor_market_status', 'Status osoby na rynku pracy', laborMarketStatuses)}
            {renderDropdown('status', 'Status', participantStatuses)}
            {renderDropdown('pup_zus_status', 'Status PUP/ZUS', pupZusStatuses)}
            {renderDropdown('education', 'Wykształcenie', educationLevels)}
            {renderTextField('notes', 'Uwagi', false)}
            <Autocomplete
              options={appUsers.map((u) => u.full_name)}
              value={form.guardian}
              onChange={(_, value) => setForm({ ...form, guardian: value ?? '' })}
              renderInput={(params) => <TextField {...params} label="Opiekun" />}
              clearOnEscape
            />
            <Divider />
            <Autocomplete
              options={trainings}
              getOptionLabel={(t) => t.name}
              value={trainingToAssign}
              onChange={(_, value) => setTrainingToAssign(value)}
              renderOption={(props, t) => (
                <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {t.color && <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: t.color, flexShrink: 0 }} />}
                  <Box>
                    <Typography variant="body2">{t.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{t.instructor ?? 'Bez prowadzącego'} · {t.hours_count} h</Typography>
                  </Box>
                </Box>
              )}
              renderInput={(params) => <TextField {...params} label="Przypisz do szkolenia (opcjonalnie)" helperText="Zostanie przypisane po zapisaniu uczestnika" />}
              clearOnEscape
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenForm(false); setEditingParticipant(null); setTrainingToAssign(null) }}>Anuluj</Button>
          <Button variant="contained" onClick={createParticipant} disabled={formErrors.pesel || formErrors.phone}>Zapisz</Button>
        </DialogActions>
      </Dialog>

      <Drawer anchor="right" open={openProfile} onClose={() => setOpenProfile(false)} slotProps={{ paper: { sx: { width: { xs: '100vw', md: '90vw', lg: '80vw', xl: 1200 }, display: 'flex', flexDirection: 'column' } } }}>
        {profileLoading && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0 }} />}
        {profile && (() => {
          const p = profile.participant
          const programColors: Record<string, string> = {
            'doradca zawodowy': '#C7D9F5', 'kompetencje cyfrowe': '#DDD6FE', 'psycholog': '#FBCFE8',
            'doradca prawny': '#FDE68A', 'pośrednictwo zawodowe': '#A7F3D0',
            'warsztaty aktywizacji społecznej': '#FED7AA', 'warsztaty aktywizacji zawodowej': '#A8D5D0', 'szkolenia zawodowe': '#E9D5FF',
          }
          const field = (label: string, value: string | number | null | undefined) => (
            <Box key={label}>
              <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>{value != null && value !== '' ? value : <span style={{ color: '#aaa' }}>—</span>}</Typography>
            </Box>
          )
          const grid2 = (items: React.ReactNode[]) => (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>{items}</Box>
          )
          const secLabel = (t: string) => (
            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'text.disabled', display: 'block', mb: 1 }}>{t}</Typography>
          )
          const colHeader = (t: string) => (
            <Box sx={{ pb: 1.5, mb: 1.5, borderBottom: '2px solid #F0EDE8' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: 13 }}>{t}</Typography>
            </Box>
          )
          const today = new Date().toISOString().slice(0, 10)
          const attendanceByKey: Record<string, { present: boolean; hours: number }> = {}
          for (const att of profile.attendance) {
            const k = `${att.program_type ?? ''}:${att.date}`
            attendanceByKey[k] = att
          }

          const renderProgram = (item: any, i: number) => {
            const color = programColors[item.program_type] ?? '#E5E7EB'
            const meetings: Array<{ label: string; date: string; time: string }> = []
            if (item.notes) {
              item.notes.split('\n').forEach((line: string) => {
                const m = line.match(/^(.+?):\s*(\d{2}\.\d{2}\.\d{4})\s*([\d:–\-]+.*)?$/)
                if (m) meetings.push({ label: m[1].trim(), date: m[2], time: (m[3] ?? '').trim() })
                else if (line.trim()) meetings.push({ label: line.trim(), date: '', time: '' })
              })
            }
            return (
              <Box key={i} sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #F0EDE8', mb: 1 }}>
                <Box sx={{ px: 1.5, py: 0.75, background: color, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, textTransform: 'capitalize' }}>{item.program_type}</Typography>
                  <Typography variant="caption" sx={{ background: 'rgba(255,255,255,0.6)', px: 1, borderRadius: 1 }}>{item.status}</Typography>
                </Box>
                <Box sx={{ px: 1, py: 0.5, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {meetings.length === 0 && <Typography variant="caption" color="text.disabled">Brak szczegółów terminu</Typography>}
                  {meetings.map((m, j) => {
                    if (!m.date) return <Typography key={j} variant="caption" color="text.secondary" sx={{ pl: 1 }}>{m.label}</Typography>
                    const [dd, mm, yyyy] = m.date.split('.')
                    const isoDate = `${yyyy}-${mm}-${dd}`
                    const isPast = isoDate < today
                    const attKey = `${item.program_type ?? ''}:${isoDate}`
                    const att = attendanceByKey[attKey]
                    const presentVal = att === undefined ? null : att.present
                    const rowBg = !isPast ? 'transparent'
                      : presentVal === true ? 'rgba(22,163,74,0.07)'
                      : presentVal === false ? 'rgba(220,38,38,0.07)'
                      : 'transparent'
                    const rowBorderColor = !isPast ? 'transparent'
                      : presentVal === true ? 'rgba(22,163,74,0.18)'
                      : presentVal === false ? 'rgba(220,38,38,0.18)'
                      : 'rgba(0,0,0,0.05)'
                    const toggleBg = !isPast ? '#F0EDE8'
                      : presentVal === true ? '#DCFCE7'
                      : presentVal === false ? '#FEE2E2'
                      : '#F3F4F6'
                    const toggleColor = !isPast ? '#C4BAB0'
                      : presentVal === true ? '#16A34A'
                      : presentVal === false ? '#DC2626'
                      : '#9CA3AF'
                    const toggleLabel = !isPast ? '·' : presentVal === true ? '✓' : presentVal === false ? '✗' : '?'
                    const toggleTitle = !isPast ? 'spotkanie zaplanowane' : presentVal === true ? 'obecny/a — kliknij aby zmienić' : presentVal === false ? 'nieobecny/a — kliknij aby zmienić' : 'brak wpisu — kliknij aby oznaczyć obecność'
                    return (
                      <Box key={j} sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 0.75, py: 0.75, borderRadius: 1.5, background: rowBg, border: '1px solid', borderColor: rowBorderColor }}>
                        <Typography variant="caption" sx={{ minWidth: 76, opacity: isPast ? 0.65 : 1, fontSize: 11, flexShrink: 0 }}>{m.label}</Typography>
                        <Box sx={{ background: isPast ? '#EBEBEB' : '#F5F3F0', borderRadius: 1, px: 0.75, py: '2px', display: 'flex', gap: 0.5, flex: 1, minWidth: 0 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, fontFamily: 'monospace', opacity: isPast ? 0.7 : 1, fontSize: 11, whiteSpace: 'nowrap' }}>{m.date}</Typography>
                          {m.time && <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace', fontSize: 11, whiteSpace: 'nowrap' }}>{m.time}</Typography>}
                        </Box>
                        <Box
                          onClick={isPast ? () => toggleAttendance(p.id, isoDate, item.program_type ?? '', presentVal) : undefined}
                          title={toggleTitle}
                          sx={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            minWidth: 32, height: 24, borderRadius: '100px',
                            background: toggleBg, color: toggleColor,
                            fontSize: 12, fontWeight: 700, px: 1,
                            cursor: isPast ? 'pointer' : 'default',
                            userSelect: 'none', flexShrink: 0,
                            border: `1.5px solid ${toggleColor}55`,
                            transition: 'all 0.12s',
                            '&:hover': isPast ? { opacity: 0.75, transform: 'scale(1.1)' } : {},
                          }}
                        >
                          {toggleLabel}
                        </Box>
                      </Box>
                    )
                  })}
                </Box>
              </Box>
            )
          }
          return <>
            {/* Header */}
            <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #F0EDE8', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{p.last_name} {p.first_name}</Typography>
                <Chip size="small" label={p.status} sx={{ fontSize: 11, height: 20, background: '#F5F3F0' }} />
                {p.warning_reasons?.length > 0
                  ? <Chip size="small" label="Braki danych" sx={{ fontSize: 11, height: 20, background: '#FEE2E2', color: '#DC2626' }} />
                  : <Chip size="small" label="Kompletny" sx={{ fontSize: 11, height: 20, background: '#DCFCE7', color: '#16A34A' }} />}
              </Box>
              <Button size="small" onClick={() => setOpenProfile(false)} sx={{ minWidth: 0, p: 0.5, color: 'text.secondary' }}>✕</Button>
            </Box>

            {/* Content: tabs on mobile, 3 columns on desktop */}
            {(() => {
              const col1 = (
                <Stack spacing={2}>
                  {secLabel('Podstawowe')}
                  {grid2([field('PESEL', p.pesel), field('Data urodzenia', p.birth_date), field('Wiek', p.age), field('Płeć', p.gender), field('Telefon', p.phone), field('Opiekun', p.guardian)])}
                  <Divider />
                  {secLabel('Adres')}
                  {grid2([field('Województwo', p.voivodeship), field('Powiat', p.county), field('Gmina', p.commune), field('Miejscowość', p.city), field('Kod pocztowy', p.postal_code), field('Ulica / adres', p.address)])}
                  <Divider />
                  {secLabel('Społeczno-zawodowe')}
                  {grid2([field('Wykształcenie', p.education), field('Status rynku pracy', p.labor_market_status), field('PUP/ZUS', p.pup_zus_status), field('Niepełnosprawność', p.disability_status), field('Sytuacja zdrowotna', p.health_status), field('Sytuacja życiowa', p.life_situation), field('Wykluczenie', p.exclusion)])}
                  {(p.notes || p.extra_contacts) && <>
                    <Divider />
                    {secLabel('Dodatkowe')}
                    {field('Uwagi', p.notes)}
                    {field('Dodatkowe kontakty', p.extra_contacts)}
                  </>}
                  {p.warning_reasons?.length > 0 && <>
                    <Divider />
                    {secLabel('Braki danych')}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                      {p.warning_reasons.map((w: string) => (
                        <Typography key={w} variant="caption" sx={{ background: '#FEE2E2', color: '#DC2626', px: 1, py: 0.25, borderRadius: 1 }}>• {w}</Typography>
                      ))}
                    </Box>
                  </>}
                </Stack>
              )
              const col2 = (!profile.programs || profile.programs.length === 0)
                ? <Typography variant="body2" color="text.secondary">Brak przypisanych programów.</Typography>
                : <>{profile.programs.map((item: any, i: number) => renderProgram(item, i))}</>
              const col3 = (
                <Stack spacing={2}>
                  {secLabel('Szkolenia zawodowe')}
                  {profile.trainings.length === 0
                    ? <Typography variant="body2" color="text.secondary">Brak przypisanych szkoleń.</Typography>
                    : profile.trainings.map((item: any) => (
                      <Box key={`${item.training_id}-${item.start_date ?? 'brak'}`} sx={{ pl: 1.5, borderLeft: '3px solid #A8D5D0', py: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.training_name} <Typography component="span" variant="caption" color="text.secondary">({item.status})</Typography></Typography>
                        <Typography variant="caption" color="text.secondary">Od: {displayValue(item.start_date)} | Do: {displayValue(item.end_date)} | Wynik: {displayValue(item.result)}</Typography>
                      </Box>
                    ))}
                  {profile.attendance.length > 0 && <>
                    <Divider />
                    {secLabel(`Obecności (${profile.attendance.length})`)}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
                      {profile.attendance.slice(0, 30).map((item: any) => (
                        <Typography key={`${item.program_type ?? ''}-${item.date}-${item.hours}`} variant="body2">
                          {item.date}: {item.present ? 'obecny/a' : 'nieobecny/a'}{item.hours ? `, ${item.hours} h` : ''}
                        </Typography>
                      ))}
                    </Box>
                    {profile.attendance.length > 30 && <Typography variant="caption" color="text.secondary">… i {profile.attendance.length - 30} więcej</Typography>}
                  </>}
                  {profile.documents.length > 0 && <>
                    <Divider />
                    {secLabel('Dokumenty')}
                    {profile.documents.map((item: any) => (
                      <Typography key={`${item.name}-${item.received_at ?? 'brak'}`} variant="body2">
                        {item.name} ({item.document_type}){item.is_required ? ' [wymagany]' : ''}{item.received_at ? ` — ${String(item.received_at).slice(0, 10)}` : ''}
                      </Typography>
                    ))}
                  </>}
                </Stack>
              )
              if (isMobile) return (
                <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                  <Tabs value={profileTab} onChange={(_, v) => setProfileTab(v)} variant="scrollable" scrollButtons="auto" sx={{ borderBottom: '1px solid #F0EDE8', flexShrink: 0, minHeight: 42, px: 1 }}>
                    <Tab label="Dane osobowe" sx={{ fontSize: 12, minHeight: 42 }} />
                    <Tab label={`Programy (${profile.programs?.length ?? 0})`} sx={{ fontSize: 12, minHeight: 42 }} />
                    <Tab label="Szkolenia" sx={{ fontSize: 12, minHeight: 42 }} />
                  </Tabs>
                  <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5 }}>
                    {profileTab === 0 && col1}
                    {profileTab === 1 && col2}
                    {profileTab === 2 && col3}
                  </Box>
                </Box>
              )
              return (
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', flex: 1, overflow: 'hidden', gap: 0 }}>
                  <Box sx={{ overflowY: 'auto', p: 2.5, borderRight: '1px solid #F0EDE8' }}>
                    {colHeader('Dane osobowe')}
                    {col1}
                  </Box>
                  <Box sx={{ overflowY: 'auto', p: 2.5, borderRight: '1px solid #F0EDE8' }}>
                    {colHeader(`Programy wsparcia (${profile.programs?.length ?? 0})`)}
                    {col2}
                  </Box>
                  <Box sx={{ overflowY: 'auto', p: 2.5 }}>
                    {colHeader('Szkolenia / Inne')}
                    {col3}
                  </Box>
                </Box>
              )
            })()}
          </>
        })()}
        {!profile && !profileLoading && (
          <Box sx={{ p: 3 }}><Typography color="text.secondary">Brak danych do wyświetlenia.</Typography></Box>
        )}
      </Drawer>

      <Dialog open={openTrainingForm} onClose={() => setOpenTrainingForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edytuj szkolenie</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Nazwa" required value={trainingForm.name} onChange={(e) => setTrainingForm({ ...trainingForm, name: e.target.value })} />
            <TextField label="Prowadzący" value={trainingForm.instructor} onChange={(e) => setTrainingForm({ ...trainingForm, instructor: e.target.value })} />
            <TextField label="Opis" multiline rows={2} value={trainingForm.description} onChange={(e) => setTrainingForm({ ...trainingForm, description: e.target.value })} />
            <Box>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary">Harmonogram dat</Typography>
                <ToggleButtonGroup
                  size="small"
                  exclusive
                  value={trainingForm.schedule_mode}
                  onChange={(_, v) => v && setTrainingForm({ ...trainingForm, schedule_mode: v })}
                >
                  <ToggleButton value="range" sx={{ fontSize: 11, px: 1.5, py: 0.25 }}>Zakres</ToggleButton>
                  <ToggleButton value="days" sx={{ fontSize: 11, px: 1.5, py: 0.25 }}>Konkretne dni</ToggleButton>
                </ToggleButtonGroup>
              </Stack>

              {trainingForm.schedule_mode === 'range' ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField
                    label="Od"
                    type="date"
                    value={trainingForm.schedule_from}
                    onChange={(e) => setTrainingForm({ ...trainingForm, schedule_from: e.target.value })}
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{ flex: 1 }}
                    size="small"
                  />
                  <Typography variant="body2" color="text.secondary">–</Typography>
                  <TextField
                    label="Do"
                    type="date"
                    value={trainingForm.schedule_to}
                    onChange={(e) => setTrainingForm({ ...trainingForm, schedule_to: e.target.value })}
                    slotProps={{ inputLabel: { shrink: true } }}
                    inputProps={{ min: trainingForm.schedule_from || undefined }}
                    sx={{ flex: 1 }}
                    size="small"
                  />
                </Stack>
              ) : (
                <DayPickerCalendar
                  dayHours={trainingForm.day_hours}
                  activeDay={trainingForm.active_day}
                  onDayClick={(day) => {
                    if (day === '__clear__') { setTrainingForm({ ...trainingForm, day_hours: {}, active_day: null }); return }
                    if (trainingForm.active_day === day) {
                      // deselect: remove day
                      const { [day]: _, ...rest } = trainingForm.day_hours
                      setTrainingForm({ ...trainingForm, day_hours: rest, active_day: null })
                    } else {
                      const next = day in trainingForm.day_hours ? trainingForm.day_hours : { ...trainingForm.day_hours, [day]: [] }
                      setTrainingForm({ ...trainingForm, day_hours: next, active_day: day })
                    }
                  }}
                  initialDate={Object.keys(trainingForm.day_hours)[0]}
                />
              )}
            </Box>

            {trainingForm.schedule_mode === 'range' ? (
              <HourRangePicker
                selectedHours={trainingForm.selected_hours}
                onChange={(hours) => setTrainingForm({ ...trainingForm, selected_hours: hours })}
              />
            ) : trainingForm.active_day ? (
              <Box sx={{ border: '2px solid #2e7d32', borderRadius: 1, p: 1.5 }}>
                <Typography variant="caption" color="success.main" fontWeight={700} sx={{ mb: 0.5, display: 'block' }}>
                  Godziny: {trainingForm.active_day} ({WEEKDAY_SHORT[new Date(trainingForm.active_day).getDay()]})
                  {' '}— kliknij inny dzień aby przejść dalej
                </Typography>
                <HourRangePicker
                  selectedHours={trainingForm.day_hours[trainingForm.active_day] ?? []}
                  onChange={(hours) => setTrainingForm({
                    ...trainingForm,
                    day_hours: { ...trainingForm.day_hours, [trainingForm.active_day!]: hours },
                  })}
                />
              </Box>
            ) : (
              <Box sx={{ p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">Wybierz dzień z kalendarza aby ustawić godziny zajęć</Typography>
              </Box>
            )}
            <Box>
              <TextField
                label="Liczba godzin programu"
                type="number"
                fullWidth
                value={trainingForm.hours_count}
                onChange={(e) => setTrainingForm({ ...trainingForm, hours_count: e.target.value })}
              />
              {(() => {
                const totalHours = Number(trainingForm.hours_count) || 0
                const scheduled = trainingForm.schedule_mode === 'days'
                  ? Object.values(trainingForm.day_hours).reduce((s, h) => s + h.length, 0)
                  : countWeekdays(trainingForm.schedule_from, trainingForm.schedule_to) * trainingForm.selected_hours.length
                const dailyHours = trainingForm.selected_hours.length
                const weekdays = countWeekdays(trainingForm.schedule_from, trainingForm.schedule_to)
                const remaining = totalHours - scheduled
                if (!scheduled && !totalHours) return null
                return (
                  <Box sx={{ mt: 1, px: 1.5, py: 1, bgcolor: '#f5f5f5', borderRadius: 1, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    {scheduled > 0 && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">Zaplanowane</Typography>
                        <Typography variant="body2" fontWeight={700}>
                          {trainingForm.schedule_mode === 'days'
                            ? `${Object.keys(trainingForm.day_hours).length} dni = ${scheduled} h`
                            : `${weekdays} dni × ${dailyHours} h = ${scheduled} h`}
                        </Typography>
                      </Box>
                    )}
                    {totalHours > 0 && scheduled > 0 && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">Pozostało do zaplanowania</Typography>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          color={remaining < 0 ? 'error' : remaining === 0 ? 'success.main' : 'text.primary'}
                        >
                          {remaining >= 0 ? `${remaining} h` : `−${Math.abs(remaining)} h (przekroczone)`}
                        </Typography>
                      </Box>
                    )}
                    {totalHours > 0 && scheduled > 0 && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">Pokrycie</Typography>
                        <Typography variant="body2" fontWeight={700} color={scheduled >= totalHours ? 'success.main' : 'warning.main'}>
                          {Math.min(Math.round((scheduled / totalHours) * 100), 100)}%
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )
              })()}
            </Box>
            <TextField select label="Status" value={trainingForm.status} onChange={(e) => setTrainingForm({ ...trainingForm, status: e.target.value })}>
              {['planowane', 'aktywne', 'zakończone', 'anulowane'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>Kolor w kalendarzu</Typography>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                {['#1976d2','#7b1fa2','#c62828','#e65100','#2e7d32','#00838f','#f9a825','#455a64'].map((c) => (
                  <Box
                    key={c}
                    onClick={() => setTrainingForm({ ...trainingForm, color: c })}
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      bgcolor: c,
                      cursor: 'pointer',
                      border: trainingForm.color === c ? '3px solid #111' : '3px solid transparent',
                      boxShadow: trainingForm.color === c ? `0 0 0 2px ${c}55` : 'none',
                      transition: 'border 0.15s, box-shadow 0.15s',
                      '&:hover': { opacity: 0.8 },
                    }}
                  />
                ))}
                <Box
                  component="label"
                  sx={{ position: 'relative', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', border: '2px dashed #bdbdbd', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', '&:hover': { borderColor: '#1976d2' } }}
                  title="Własny kolor"
                >
                  <Typography variant="caption" sx={{ fontSize: 16, lineHeight: 1, pointerEvents: 'none' }}>+</Typography>
                  <input
                    type="color"
                    value={trainingForm.color || '#1976d2'}
                    onChange={(e) => setTrainingForm({ ...trainingForm, color: e.target.value })}
                    style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                  />
                </Box>
                {trainingForm.color && (
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: trainingForm.color, border: '1px solid #e0e0e0' }} />
                    <Typography variant="caption" color="text.secondary">{trainingForm.color}</Typography>
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => setTrainingForm({ ...trainingForm, color: '' })}
                    >
                      usuń
                    </Typography>
                  </Stack>
                )}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTrainingForm(false)}>Anuluj</Button>
          <Button variant="contained" onClick={saveTraining} disabled={!trainingForm.name}>Zapisz</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openStatusColors} onClose={() => setOpenStatusColors(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Kolory statusów</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {availableStatuses.map((status) => (
              <Stack key={status} direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                <Box sx={{ minWidth: 230 }}>
                  <Typography variant="body2">{status}</Typography>
                </Box>
                <TextField
                  type="color"
                  size="small"
                  value={statusColors[status] ?? '#9e9e9e'}
                  onChange={(event) => updateStatusColor(status, event.target.value)}
                  sx={{ width: 80 }}
                />
                <Chip
                  label={status}
                  sx={{
                    backgroundColor: statusColors[status] ?? '#9e9e9e',
                    color: textColorForBackground(statusColors[status] ?? '#9e9e9e'),
                  }}
                />
              </Stack>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetStatusColors}>Przywróć domyślne</Button>
          <Button onClick={() => setOpenStatusColors(false)}>Zamknij</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ flex: 1, height: 10, borderRadius: 5, bgcolor: '#f0f0f0', overflow: 'hidden' }}>
        <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: color, borderRadius: 5, transition: 'width 0.4s' }} />
      </Box>
      <Typography variant="caption" sx={{ minWidth: 32, textAlign: 'right', fontWeight: 700 }}>{value}</Typography>
    </Box>
  )
}

function MonthChart({ stats }: { stats: MonthStat[] }) {
  const maxVal = Math.max(...stats.flatMap((s) => [s.added, s.completed]), 1)
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, height: 120, pt: 1 }}>
      {stats.map((s) => (
        <Box key={s.month} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: '100%', display: 'flex', gap: '2px', alignItems: 'flex-end', height: 90 }}>
            <Box
              title={`Nowi: ${s.added}`}
              sx={{ flex: 1, bgcolor: '#1976d2', borderRadius: '3px 3px 0 0', height: `${Math.max((s.added / maxVal) * 90, s.added > 0 ? 4 : 0)}px`, transition: 'height 0.4s' }}
            />
            <Box
              title={`Ukończyli: ${s.completed}`}
              sx={{ flex: 1, bgcolor: '#2e7d32', borderRadius: '3px 3px 0 0', height: `${Math.max((s.completed / maxVal) * 90, s.completed > 0 ? 4 : 0)}px`, transition: 'height 0.4s' }}
            />
          </Box>
          <Typography variant="caption" sx={{ fontSize: 10, color: 'text.secondary' }}>{s.label}</Typography>
        </Box>
      ))}
    </Box>
  )
}

type MetricDef = {
  label: string
  value: number
  icon: ReactNode
  iconBg: string
  target: string
  filter?: string
  description: string
}

function DashboardView({ dashboard, onNavigate }: { dashboard: DashboardData | null; onNavigate: (view: string, filter?: string) => void }) {
  const d = dashboard
  const total = (d?.in_training_count ?? 0) + (d?.completed_total ?? 0) + (d?.resigned_total ?? 0) + (d?.reserve_count ?? 0) + (d?.reserve_participants ?? 0)

  const metrics: MetricDef[] = [
    {
      label: 'W trakcie szkolenia',
      value: d?.in_training_count ?? 0,
      icon: <Groups fontSize="small" />,
      iconBg: 'linear-gradient(135deg, #4361EE 0%, #738BFF 100%)',
      target: 'Uczestnicy',
      filter: 'W trakcie szkolenia',
      description: 'Aktywni uczestnicy programu',
    },
    {
      label: 'Wymaga uzupełnienia',
      value: d?.reserve_participants ?? 0,
      icon: <Warning fontSize="small" />,
      iconBg: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)',
      target: 'Uczestnicy',
      filter: 'Wymaga uzupełnienia danych',
      description: 'Oczekuje na uzupełnienie danych',
    },
    {
      label: 'Braki danych',
      value: d?.incomplete_participants ?? 0,
      icon: <PersonOff fontSize="small" />,
      iconBg: 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)',
      target: 'Uczestnicy',
      filter: '__incomplete__',
      description: 'Niekompletne profile uczestników',
    },
    {
      label: 'Zbliżające się terminy',
      value: d?.upcoming_deadlines ?? 0,
      icon: <AccessTime fontSize="small" />,
      iconBg: 'linear-gradient(135deg, #8B5CF6 0%, #C4B5FD 100%)',
      target: 'Harmonogram',
      description: 'Terminy w ciągu najbliższych 14 dni',
    },
    {
      label: 'Zaległe terminy',
      value: d?.overdue_deadlines ?? 0,
      icon: <AlarmOff fontSize="small" />,
      iconBg: 'linear-gradient(135deg, #F43F5E 0%, #FB7185 100%)',
      target: 'Harmonogram',
      description: 'Nieukończone, przeterminowane wpisy',
    },
    {
      label: 'Brakujące obecności',
      value: d?.missing_attendance ?? 0,
      icon: <EventBusy fontSize="small" />,
      iconBg: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
      target: 'Szkolenia',
      description: 'Nieobecności do weryfikacji',
    },
  ]

  const cardBase = {
    elevation: 0 as const,
    onClick: (m: MetricDef) => onNavigate(m.target, m.filter),
  }

  function MetricCard({ m, variant = 'white' }: { m: MetricDef; variant?: 'white' | 'lime' | 'teal' | 'red' }) {
    const bg = variant === 'lime' ? '#C7D9F5' : variant === 'teal' ? '#A8D5D0' : variant === 'red' ? '#F9D0D0' : '#fff'
    const textColor = '#1A1A1A'
    const subColor = variant === 'white' ? '#888' : '#1A1A1A99'
    const linkColor = variant === 'white' ? '#888' : '#1A1A1A'
    return (
      <Paper
        elevation={0}
        onClick={() => onNavigate(m.target, m.filter)}
        sx={{
          p: '22px 24px',
          borderRadius: '20px',
          background: bg,
          cursor: 'pointer',
          border: variant === 'white' ? '1px solid #EEEAE3' : 'none',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'transform 0.15s, box-shadow 0.15s',
          '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 28px rgba(0,0,0,0.10)' },
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box sx={{ width: 36, height: 36, borderRadius: '10px', background: variant === 'white' ? '#F0EDE8' : 'rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: textColor }}>
            {m.icon}
          </Box>
          <Typography variant="caption" sx={{ color: linkColor, fontWeight: 600, fontSize: 12, opacity: 0.7 }}>
            Szczegóły →
          </Typography>
        </Stack>
        <Box sx={{ mt: 2 }}>
          <Typography sx={{ fontWeight: 800, fontSize: 36, lineHeight: 1, color: textColor, letterSpacing: '-1px' }}>
            {m.value.toLocaleString('pl-PL')}
          </Typography>
          <Typography sx={{ fontWeight: 700, fontSize: 14, color: textColor, mt: 0.5 }}>{m.label}</Typography>
          <Typography sx={{ fontSize: 12, color: subColor, mt: 0.25 }}>{m.description}</Typography>
        </Box>
      </Paper>
    )
  }

  return (
    <Stack spacing={2.5}>
      {/* ── Row 1: Featured + stacked cards + chart ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.6fr', gap: 2, alignItems: 'stretch' }}>
        {/* Featured — lime */}
        <MetricCard m={metrics[0]} variant="lime" />

        {/* Middle — 2 stacked */}
        <Stack spacing={2} sx={{ height: '100%' }}>
          <MetricCard m={metrics[1]} variant="red" />
          <MetricCard m={metrics[2]} variant="teal" />
        </Stack>

        {/* Chart */}
        <Paper elevation={0} sx={{ borderRadius: '20px', border: '1px solid #EEEAE3', p: '22px 24px', display: 'flex', flexDirection: 'column' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography sx={{ fontWeight: 800, fontSize: 15, color: '#1A1A1A' }}>Aktywność — 6 miesięcy</Typography>
            <Stack direction="row" spacing={1.5}>
              {[['Nowi', '#1A1A1A'], ['Ukończyli', '#A8D5D0']].map(([l, c]) => (
                <Stack key={l} direction="row" alignItems="center" spacing={0.5}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: c }} />
                  <Typography variant="caption" sx={{ color: '#888', fontSize: 11 }}>{l}</Typography>
                </Stack>
              ))}
            </Stack>
          </Stack>
          <Divider sx={{ mb: 1.5, borderColor: '#F0EDE8' }} />
          <Box sx={{ flex: 1 }}>
            <MonthChart stats={d?.monthly_stats ?? []} />
          </Box>
        </Paper>
      </Box>

      {/* ── Row 2: 3 more metrics ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
        <MetricCard m={metrics[3]} variant="white" />
        <MetricCard m={metrics[4]} variant="white" />
        <MetricCard m={metrics[5]} variant="white" />
      </Box>

      {/* ── Row 3: Stats + alerts ── */}
      <Box className="twoColumns">
        <Paper elevation={0} sx={{ borderRadius: '20px', border: '1px solid #EEEAE3', p: '22px 24px' }}>
          <Typography sx={{ fontWeight: 800, fontSize: 15, color: '#1A1A1A', mb: 1.5 }}>Statystyki uczestnictwa</Typography>
          <Divider sx={{ borderColor: '#F0EDE8', mb: 2 }} />
          <Stack spacing={1.5}>
            {[
              ['W trakcie szkolenia', d?.in_training_count ?? 0, '#1A1A1A'],
              ['Ukończyli szkolenie', d?.completed_total ?? 0, '#4CAF50'],
              ['Rezerwa', d?.reserve_count ?? 0, '#888'],
              ['Zrezygnowali / przerwali', d?.resigned_total ?? 0, '#EF4444'],
            ].map(([label, val, color]) => (
              <Box key={String(label)}>
                <Stack direction="row" justifyContent="space-between" mb={0.5}>
                  <Typography sx={{ fontSize: 13, color: '#555' }}>{String(label)}</Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: String(color) }}>{Number(val)}</Typography>
                </Stack>
                <MiniBar value={Number(val)} max={total} color={String(color)} />
              </Box>
            ))}
            <Divider sx={{ borderColor: '#F0EDE8' }} />
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A' }}>Wskaźnik ukończenia</Typography>
              <Box sx={{ px: 1.5, py: 0.4, borderRadius: '100px', bgcolor: (d?.completion_rate ?? 0) >= 70 ? '#C7D9F5' : '#FFE082', fontSize: 12, fontWeight: 800, color: '#1A1A1A' }}>
                {d?.completion_rate ?? 0}%
              </Box>
            </Stack>
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ borderRadius: '20px', border: '1px solid #EEEAE3', p: '22px 24px' }}>
          <Typography sx={{ fontWeight: 800, fontSize: 15, color: '#1A1A1A', mb: 1.5 }}>Alerty & ostatnie działania</Typography>
          <Divider sx={{ borderColor: '#F0EDE8', mb: 1.5 }} />
          <Stack spacing={1}>
            {(d?.system_alerts ?? []).map((alert) => (
              <Box key={alert} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, p: '10px 14px', borderRadius: '12px', bgcolor: alert.includes('dobrej') ? '#F0F9F0' : '#FFF8E6', border: `1px solid ${alert.includes('dobrej') ? '#C8E6C9' : '#FFE0B2'}` }}>
                <Typography sx={{ fontSize: 12, color: '#555', lineHeight: 1.4 }}>{alert}</Typography>
              </Box>
            ))}
            <Divider sx={{ borderColor: '#F0EDE8', my: 0.5 }} />
            {(d?.recent_actions ?? []).slice(0, 4).map((item) => (
              <Stack key={`${item.action}-${item.created_at}`} direction="row" justifyContent="space-between">
                <Typography sx={{ fontSize: 12, color: '#555' }}>{item.action} / {item.entity} #{item.entity_id ?? '-'}</Typography>
                <Typography sx={{ fontSize: 11, color: '#aaa' }}>{new Date(item.created_at).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</Typography>
              </Stack>
            ))}
          </Stack>
        </Paper>
      </Box>
    </Stack>
  )
}

function ParticipantsView({
  participants,
  onEdit,
  onOpenProfile,
  statusColors,
  appUsers,
  initialStatusFilter = 'all',
}: {
  participants: Participant[]
  onEdit: (participant: Participant) => void
  onOpenProfile: (participant: Participant) => void
  statusColors: Record<string, string>
  appUsers: AppUser[]
  initialStatusFilter?: string
}) {
  const [showPesel, setShowPesel] = useState(false)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter)
  useEffect(() => { setStatusFilter(initialStatusFilter) }, [initialStatusFilter])
  const [sortKey, setSortKey] = useState<ParticipantSortKey>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const statuses = useMemo(() => [...new Set(participants.map((participant) => participant.status))].sort((a, b) => a.localeCompare(b, 'pl')), [participants])
  const visibleParticipants = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return participants
      .filter((participant) => {
        if (statusFilter === 'all') return true
        if (statusFilter === '__incomplete__') return !participant.is_complete
        return participant.status === statusFilter
      })
      .filter((participant) => !normalizedQuery || participantSearchText(participant).includes(normalizedQuery))
      .sort((a, b) => {
        const left = participantSortValue(a, sortKey)
        const right = participantSortValue(b, sortKey)
        const result = typeof left === 'number' && typeof right === 'number'
          ? left - right
          : String(left).localeCompare(String(right), 'pl')
        return sortDirection === 'asc' ? result : -result
      })
  }, [participants, query, sortDirection, sortKey, statusFilter])

  function changeSort(nextKey: ParticipantSortKey) {
    if (nextKey === sortKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
      return
    }
    setSortKey(nextKey)
    setSortDirection('asc')
  }

  function sortableHeader(label: string, key: ParticipantSortKey, extra?: ReactNode) {
    return (
      <TableSortLabel
        active={sortKey === key}
        direction={sortKey === key ? sortDirection : 'asc'}
        onClick={() => changeSort(key)}
      >
        <span className="headerLabel">{label}</span>
        {extra}
      </TableSortLabel>
    )
  }

  return (
    <Paper elevation={0} className="tablePanel">
      <Box className="tableToolbar">
        <Typography variant="body2" color="text.secondary">Dane wrażliwe są domyślnie ukryte</Typography>
        <Box className="tableFilters">
          <TextField
            size="small"
            label="Szukaj"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <TextField
            select
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <MenuItem value="all">Wszystkie</MenuItem>
            <MenuItem value="__incomplete__">Braki danych (niekompletne)</MenuItem>
            {statuses.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
          </TextField>
        </Box>
      </Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell title="Automatyzacja powiadomień mailowych (do ustalenia)">Pow. mail</TableCell>
              <TableCell>{sortableHeader('Nazwisko i imię', 'name')}</TableCell>
              <TableCell>{sortableHeader('Lampka', 'warning')}</TableCell>
              <TableCell>{sortableHeader('Telefon', 'phone')}</TableCell>
              <TableCell>{sortableHeader('Status', 'status')}</TableCell>
              <TableCell>{sortableHeader('Opiekun', 'guardian')}</TableCell>
              <TableCell>{sortableHeader('Ostatnia modyfikacja', 'updated_at')}</TableCell>
              <TableCell>Akcje</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleParticipants.map((participant) => (
              <TableRow key={participant.id} hover onClick={() => onOpenProfile(participant)} sx={{ cursor: 'pointer' }}>
                <TableCell sx={{ color: 'text.disabled', fontSize: 12 }}>—</TableCell>
                <TableCell>{participant.last_name} {participant.first_name}</TableCell>
                <TableCell>
                  {participant.warning_reasons.length > 0 ? <ErrorIcon color="error" /> : <Chip color="success" label="OK" size="small" />}
                </TableCell>
                <TableCell>{participant.phone}</TableCell>
                <TableCell>
                  <Chip
                    label={participant.status}
                    sx={{
                      backgroundColor: statusColors[participant.status] ?? '#9e9e9e',
                      color: textColorForBackground(statusColors[participant.status] ?? '#9e9e9e'),
                    }}
                  />
                </TableCell>
                <TableCell>{participant.guardian ?? '-'}</TableCell>
                <TableCell>
                  <Typography variant="body2">{new Date(participant.updated_at).toLocaleString('pl-PL')}</Typography>
                  {participant.updated_by_name && <Typography variant="caption" color="text.secondary">{participant.updated_by_name}</Typography>}
                </TableCell>
                <TableCell>
                  <Button size="small" startIcon={<Edit />} onClick={(event) => { event.stopPropagation(); onEdit(participant) }}>
                    Edytuj
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {visibleParticipants.length === 0 && (
              <TableRow>
                <TableCell colSpan={8}>
                  <Typography color="text.secondary" align="center">Brak wyników dla wybranych filtrów</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
}

function TrainingsView({ trainings, onBootstrap, onEdit }: { trainings: Training[]; onBootstrap: () => void; onEdit: (t: Training) => void }) {
  return (
    <Paper className="panel" elevation={0}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>Szkolenia</Typography>
        <Button variant="contained" onClick={onBootstrap}>Utwórz szkolenia i przypisz uczestników</Button>
      </Stack>
      <Divider />
      {trainings.length === 0 && <Typography color="text.secondary">Brak szkoleń. API jest gotowe na dodawanie i przypisywanie uczestników.</Typography>}
      {trainings.map((training) => (
        <Box key={training.id} className="trainingRow" sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Box sx={{ position: 'relative' }}>
              <School />
              {training.color && (
                <Box sx={{ position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, borderRadius: '50%', bgcolor: training.color, border: '1.5px solid #fff' }} />
              )}
            </Box>
            <Box>
              <Stack direction="row" alignItems="center" spacing={1}>
                {training.color && <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: training.color, flexShrink: 0 }} />}
                <Typography sx={{ fontWeight: 800 }}>{training.name}</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {training.instructor ?? 'Bez prowadzącego'} / {training.hours_count} h / {training.status}
              </Typography>
              {training.description && (
                <Typography variant="caption" color="text.secondary">{training.description}</Typography>
              )}
              {training.schedule && (() => {
                const [dp, tp] = training.schedule.split('|')
                const rawDp = dp?.trim() ?? ''
                let dateStr: string
                if (rawDp.startsWith('days:')) {
                  const days = rawDp.slice(5).split(',').filter(Boolean)
                  const fmt = (s: string) => `${s.slice(8)}.${s.slice(5,7)}`
                  dateStr = days.length <= 3 ? days.map(fmt).join(', ') : `${days.length} dni`
                } else {
                  dateStr = rawDp.replace('/', '–')
                }
                const hours = decodeHours((tp ?? '').trim())
                const timeStr = hours.length > 0 ? hoursLabel(hours) : ''
                return (
                  <Typography variant="caption" color="text.secondary">
                    📅 {dateStr}{timeStr ? ` · 🕐 ${timeStr}` : ''}
                  </Typography>
                )
              })()}
            </Box>
          </Box>
          <Button size="small" startIcon={<Edit />} onClick={() => onEdit(training)}>Edytuj</Button>
        </Box>
      ))}
    </Paper>
  )
}

function PlaceholderView({ title }: { title: string }) {
  return (
    <Paper className="panel" elevation={0}>
      <Typography variant="h6" sx={{ fontWeight: 800 }}>{title}</Typography>
      <Typography color="text.secondary">
        Moduł ma przygotowane miejsce w nawigacji i modelu systemu. Kolejny krok to dodanie ekranów CRUD oraz reguł uprawnień dla tej sekcji.
      </Typography>
    </Paper>
  )
}

export default App
