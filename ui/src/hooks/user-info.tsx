
import { createContext, PropsWithChildren, useContext } from "react"
import { UserInfo } from "../lib/auth"

const UserInfoContext = createContext(null as unknown as UserInfo)

export type UserInfoProviderProps = {
    userInfo: UserInfo
}

export function UserInfoProvider(props: PropsWithChildren<UserInfoProviderProps>) {
    return (
        <UserInfoContext.Provider value={props.userInfo} children={props.children} />
    )
}

export function useUserInfo() {
    return useContext(UserInfoContext)
}
