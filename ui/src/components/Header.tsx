import ExpandMore from "@mui/icons-material/ExpandMore"
import AppBar from '@mui/material/AppBar'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Toolbar from '@mui/material/Toolbar'
import Tooltip from '@mui/material/Tooltip'
import Typography from "@mui/material/Typography"
import { useState } from "react"
import { useAuthClient } from "../hooks/auth"
import { useDockerDesktopClient } from "../hooks/docker-desktop"
import { useUserInfo } from "../hooks/user-info"
import logoDarkSrc from "../images/logo-dark.svg"
import { getUserInfoDisplayName } from "../lib/auth"

export default function Header() {
    const auth = useAuthClient()
    const dd = useDockerDesktopClient()
    const usr = useUserInfo()
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

    const open = Boolean(anchorEl)

    const onOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget)
    }
    const onCloseMenu = () => {
        setAnchorEl(null)
    }

    const onLogout = () => {
        localStorage.clear()
        dd.host.openExternal(auth.buildLogoutURL())
        window.location.reload()
    }

    return (
        <header>
            <Box sx={{ flexGrow: 1 }}>
                <AppBar position="static">
                    <Toolbar sx={{ bgcolor: "#1e5a89" }}>
                        <Box sx={{ mr: "auto" }}>
                            <img style={{ maxHeight: "2.5rem", width: "auto" }} src={logoDarkSrc} alt="Logo" />
                        </Box>
                        <Box>
                            <Tooltip title="Account settings">
                                <Button onClick={onOpenMenu} variant="text">
                                    <Stack direction="row" alignItems="center">
                                        <Avatar alt={getUserInfoDisplayName(usr)} src={usr.picture} imgProps={{ referrerPolicy: "no-referrer" }} />
                                        <Stack sx={{ ml: 2 }} alignItems="flex-start">
                                            <Typography variant="body1" sx={{ color: "#fff", textTransform: "none" }}>{getUserInfoDisplayName(usr)}</Typography>
                                            <Typography variant="caption" sx={{ color: "#ffffff99", textTransform: "none" }}>{usr.email}</Typography>
                                        </Stack>
                                        <ExpandMore sx={{ color: "#fff" }} />
                                    </Stack>
                                </Button>
                            </Tooltip>
                        </Box>
                        <Menu anchorEl={anchorEl}
                            id="account-menu"
                            open={open}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'right',
                            }}
                            transformOrigin={{
                                vertical: 'bottom',
                                horizontal: 'right',
                            }}
                            onClose={onCloseMenu}
                            onClick={onCloseMenu}>
                            <MenuItem onClick={onLogout}>
                                Logout
                            </MenuItem>
                        </Menu>
                    </Toolbar>
                </AppBar>
            </Box>
        </header >
    )
}
