import Delete from "@mui/icons-material/Delete"
import ListItemIcon from "@mui/material/ListItemIcon"
import ListItemText from "@mui/material/ListItemText"
import MenuItem from "@mui/material/MenuItem"
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { useDockerDesktopClient } from "../hooks/docker-desktop"
import { useProjectToken } from "../hooks/project-token"
import { ConfirmationDialog } from "./ConfirmationDialog"

export type Props = {
    instanceID: string
}

export default function DeleteCoreInstance(props: Props) {
    const dd = useDockerDesktopClient()
    const projectToken = useProjectToken()
    const mutation = useMutation(() => deleteCoreInstance())
    const [open, setOpen] = useState(false)

    const onDelete = () => {
        setOpen(true)
    }

    const onConfirm = (ok: boolean) => {
        setOpen(false)

        if (ok) {
            mutation.mutateAsync().then(() => {
                window.location.reload()
                dd.desktopUI.toast.success("Core instance deleted successfully")
            }, (err: Error) => {
                dd.desktopUI.toast.error(err.message)
            })
        }
    }

    const deleteCoreInstance = async () => {
        if (dd.extension.host === undefined) {
            throw new Error("docker-desktop extension host not enabled")
        }

        const args = [
            "delete",
            "core_instance",
            "kubernetes",
            props.instanceID,
            "--token", projectToken.token,
            "--kube-context", "docker-desktop",
            "--yes",
        ]

        if (process.env.REACT_APP_CLOUD_BASE_URL !== "https://cloud-api.calyptia.com") {
            args.push("--cloud-url", process.env.REACT_APP_CLOUD_BASE_URL)
        }

        const output = await dd.extension.host.cli.exec("calyptia", args)
        if (output.stderr !== "") {
            throw new Error(output.stderr)
        }
    }

    return (
        <>
            <MenuItem onClick={onDelete} disabled={mutation.isLoading}>
                <ListItemIcon>
                    <Delete />
                </ListItemIcon>
                <ListItemText>Delete</ListItemText>
            </MenuItem>
            <ConfirmationDialog keepMounted open={open} title="Delete Core Instance" onClose={onConfirm}>
                Are you sure you want to delete your core instance?
            </ConfirmationDialog>
        </>
    )
}
