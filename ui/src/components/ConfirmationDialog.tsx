import Button from "@mui/material/Button"
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import { PropsWithChildren } from "react"

export type ConfirmationDialogProps = PropsWithChildren<{
    keepMounted: boolean
    title: string
    open: boolean
    onClose: (value: boolean) => void | Promise<void>
}>

export function ConfirmationDialog(props: ConfirmationDialogProps) {
    const onCancel = () => {
        props.onClose(false)
    }

    const onOK = () => {
        props.onClose(true)
    }

    return (
        <Dialog
            sx={{ '& .MuiDialog-paper': { width: '80%', maxHeight: 435 } }}
            maxWidth="xs"
            open={props.open}
            keepMounted={props.keepMounted}
        >
            <DialogTitle>{props.title}</DialogTitle>
            <DialogContent>{props.children}</DialogContent>
            <DialogActions>
                <Button autoFocus onClick={onCancel}>Cancel</Button>
                <Button onClick={onOK} color="error">Sure</Button>
            </DialogActions>
        </Dialog>
    )
}
