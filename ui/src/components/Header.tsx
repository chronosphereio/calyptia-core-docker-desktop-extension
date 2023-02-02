import { useAuth0 } from "@auth0/auth0-react"
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
import { useDockerDesktopClient } from "../hooks/docker-desktop"
import logoDarkSrc from "../images/logo-dark.svg"
import { getUserInfoDisplayName } from "../lib/auth"

const headerBGColor = "#1E5A89"
const headerTextColor = "#fff"

export default function Header() {
    const { logout, user } = useAuth0()
    const dd = useDockerDesktopClient()
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

    const open = Boolean(anchorEl)

    const onOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget)
    }
    const onCloseMenu = () => {
        setAnchorEl(null)
    }

    const onLogout = () => {
        logout({
            openUrl: async url => {
                dd.host.openExternal(url)
            },
        })
    }

    return (
        <header>
            <AppBar position="static" sx={{ bgcolor: headerBGColor }}>
                <Toolbar>
                    <Box sx={{ mr: "auto" }}>
                        <img style={{ maxHeight: "2.5rem", width: "auto" }} src={logoDarkSrc} alt="Logo" />
                    </Box>
                    <Box>
                        <Tooltip title="Account settings">
                            <Button onClick={onOpenMenu} variant="text" sx={{ color: headerTextColor }}>
                                <Stack direction="row" alignItems="center">
                                    <Avatar alt={getUserInfoDisplayName(user)} src={user.picture} imgProps={{ referrerPolicy: "no-referrer" }} />
                                    <Stack sx={{ ml: 2 }} alignItems="flex-start">
                                        <Typography variant="body1" sx={{ textTransform: "none" }}>{getUserInfoDisplayName(user)}</Typography>
                                        <Typography variant="caption" sx={{ textTransform: "none", opacity: 0.6 }} >{user.email}</Typography>
                                    </Stack>
                                    <ExpandMore />
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
        </header >
    )
}
