import MoreVert from "@mui/icons-material/MoreVert"
import IconButton from "@mui/material/IconButton"
import Menu from "@mui/material/Menu"
import { useState } from "react"
import DeleteCoreInstance from "./DeleteCoreInstance"

export type Props = {
    instanceID: string
}

export default function CoreInstanceMenu(props: Props) {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
    const open = Boolean(anchorEl)

    const onOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget)
    }

    const onClose = () => {
        setAnchorEl(null)
    }

    return (
        <>
            <IconButton onClick={onOpen}>
                <MoreVert />
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={onClose}
            >
                <DeleteCoreInstance instanceID={props.instanceID} />
            </Menu>
        </>
    )
}
