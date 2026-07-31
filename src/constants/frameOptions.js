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
  },
  {
    id: 'black',
    label: '블랙',
    background: '#18141a',
    foreground: '#ffffff',
    secondaryText: '#d9cfe0',
    border: '#342b36',
  },
  {
    id: 'purple',
    label: '퍼플',
    background: '#76518f',
    foreground: '#ffffff',
    secondaryText: '#f0e6f6',
    border: '#5b3970',
  },
  {
    id: 'pink',
    label: '핑크',
    background: '#f3a6cb',
    foreground: '#3b2330',
    secondaryText: '#6a314d',
    border: '#db79ad',
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
