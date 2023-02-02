import Delete from "@mui/icons-material/Delete"
import ListItemIcon from "@mui/material/ListItemIcon"
import ListItemText from "@mui/material/ListItemText"
import MenuItem from "@mui/material/MenuItem"
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { CLOUD_BASE_URL } from "../consts"
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
            }, err => {
                dd.desktopUI.toast.error(err.message || err.stderr)
            })
        }
    }

    const deleteVivo = async () => {
        if (dd.extension.host === undefined) {
            throw new Error("docker-desktop extension host not enabled")
        }

        const output = await dd.extension.host.cli.exec("kubectl", [
            "delete",
            "services,deployments,pods",
            "-l", `"app.kubernetes.io/name=vivo"`,
            "--context", "docker-desktop",
        ])
        if (output.stderr !== "") {
            throw new Error(output.stderr)
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

        if (CLOUD_BASE_URL !== "https://cloud-api.calyptia.com") {
            args.push("--cloud-url", CLOUD_BASE_URL)
        }

        const deleteVivoPromise = deleteVivo()
        const output = await dd.extension.host.cli.exec("calyptia", args)
        if (output.stderr !== "") {
            throw new Error(output.stderr)
        }
        await deleteVivoPromise
    }

    return (
        <>
            <MenuItem onClick={onDelete} disabled={mutation.isLoading}>
                <ListItemIcon>
                    <Delete />
                </ListItemIcon>
                <ListItemText>Delete</ListItemText>
            </MenuItem>
            <ConfirmationDialog confirmLabel="Delete" keepMounted open={open} title="Delete Core Instance" onClose={onConfirm}>
                Are you sure you want to delete your core instance?
            </ConfirmationDialog>
        </>
    )
}
