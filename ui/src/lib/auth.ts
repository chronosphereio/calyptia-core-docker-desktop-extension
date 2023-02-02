import { User } from "@auth0/auth0-react"

export function getUserInfoDisplayName(usr: User) {
    if (typeof usr.name === "string" && usr.name !== "") {
        return usr.name
    }

    {
        const s = [usr.given_name, usr.middle_name, usr.family_name].join(" ")
        if (s !== "") {
            return s
        }
    }

    if (typeof usr.nickname === "string" && usr.nickname !== "") {
        return usr.nickname
    }

    if (typeof usr.preferred_username === "string" && usr.preferred_username !== "") {
        return usr.preferred_username
    }

    return ""
}
