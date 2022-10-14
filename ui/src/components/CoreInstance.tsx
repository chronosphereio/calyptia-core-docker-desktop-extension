import StyledCard from "./StyledCard"

type Props = {
    instanceID: string
}

export default function CoreInstance(props: Props) {
    return (
        <StyledCard title={props.instanceID} />
    )
}
