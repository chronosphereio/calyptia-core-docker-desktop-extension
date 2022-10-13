import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'

export default function Header() {
    const onLogout = () => {
        localStorage.clear()
        window.location.reload()
    }

    return (
        <header>
            <Box sx={{ flexGrow: 1 }}>
                <AppBar position="static">
                    <Toolbar>
                        <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
                            Calyptia Core
                        </Typography>
                        <Button color="inherit" onClick={onLogout}>Logout</Button>
                    </Toolbar>
                </AppBar>
            </Box>
        </header>
    )
}
