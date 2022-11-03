import MCard from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
import CardHeader, { CardHeaderTypeMap } from "@mui/material/CardHeader"
import useTheme from "@mui/material/styles/useTheme"
import { PropsWithChildren } from "react"

export type CardProps = {
    title: string
    subheader?: string
    action?: CardHeaderTypeMap["props"]["action"]
}

export default function StyledCard(props: PropsWithChildren<CardProps>) {
    const theme = useTheme()
    return (
        <MCard elevation={0} sx={{ outline: "1px solid rgba(63, 81, 181, 0.08)" }}>
            <CardHeader
                title={props.title}
                subheader={props.subheader}
                sx={{ bgcolor: theme.palette.mode === "dark" ? "#3B5262" : "rgba(63, 81, 181, 0.08)" }}
                action={props.action}
                titleTypographyProps={{ sx: { color: theme.palette.mode === "dark" ? "text.primary" : "text.secondary" } }}
                subheaderTypographyProps={{ sx: { color: theme.palette.mode === "dark" ? "text.primary" : "text.secondary", opacity: 0.7, fontSize: "0.875em" } }} />
            <CardContent children={props.children} />
        </MCard>
    )
}
