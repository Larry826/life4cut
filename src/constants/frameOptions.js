export const FRAME_BRAND_MESSAGE = 'OAZ LIFE4CUT'
export const DEFAULT_FRAME_COLOR = 'white'
export const DEFAULT_FRAME_INPUT_MESSAGE = ''
export const DEFAULT_SHOW_FRAME_DATE = true
export const FRAME_MESSAGE_MAX_LENGTH = 24

export const FRAME_OPTIONS = [
  {
    id: 'white',
    label: '화이트',
    background: '#ffffff',
    foreground: '#211822',
    secondaryText: '#6f6470',
    border: '#e7dfe8',
    accent: '#ed5ba7',
    softAccent: '#fff0f7',
  },
  {
    id: 'black',
    label: '블랙',
    background: '#18141a',
    foreground: '#ffffff',
    secondaryText: '#d9cfe0',
    border: '#342b36',
    accent: '#ed5ba7',
    softAccent: '#2a202c',
  },
  {
    id: 'oaz',
    label: 'OAZ 스타일',
    background: '#fffdf8',
    foreground: '#18141a',
    secondaryText: '#645a65',
    border: '#eadfea',
    accent: '#ed5ba7',
    softAccent: '#fff0f7',
  },
]

export function getFrameOption(frameColor) {
  return FRAME_OPTIONS.find((option) => option.id === frameColor) ?? FRAME_OPTIONS[0]
}

export function formatLocalFrameDate(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}.${month}.${day}`
}
