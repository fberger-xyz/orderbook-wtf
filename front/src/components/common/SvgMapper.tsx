import { IconIds } from '@/enums'
import IconWrapper from './IconWrapper'
import LightModeSVG from '../icons/light-mode-svg.icon'
import DarkModeSVG from '../icons/dark-mode-svg.icon'

export default function SvgMapper(props: { icon: IconIds; className?: string }) {
    // ui
    if (props.icon === IconIds.THEME_LIGHT) return <LightModeSVG className={props.className} />
    if (props.icon === IconIds.THEME_DARK) return <DarkModeSVG className={props.className} />

    // fallback
    return <IconWrapper icon={props.icon} className={props.className} />
}
