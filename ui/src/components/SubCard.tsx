import Box from "@mui/material/Box"
import useTheme from "@mui/material/styles/useTheme"
import type { PropsWithChildren } from "react"

export function SubCard(props: PropsWithChildren<any>) {
    const theme = useTheme()
    return (
        <Box p={2} borderRadius={1} bgcolor={theme.palette.mode === "dark" ? "#3B5262" : "#FAFAFA"} sx={{
            outline: "1px solid rgba(63, 81, 181, 0.08)"
        }} {...props} />
    )
}
