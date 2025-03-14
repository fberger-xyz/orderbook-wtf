import { AppThemes } from '@/enums'

export const colors: Record<'line' | 'text', Record<AppThemes, string>> = {
    line: { [AppThemes.LIGHT]: '#e4e4e7', [AppThemes.DARK]: '#334155' },
    text: { [AppThemes.LIGHT]: '#71717a', [AppThemes.DARK]: '#8b9bb1' },
}
