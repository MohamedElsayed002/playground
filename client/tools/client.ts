import { getAllUsersDef, getUserDataDef, getUsersCountDef, sendEmailDef } from "./definitions"



export const getTotalUsersClient = getUsersCountDef.client(async () => {
    const res = await fetch('/api/total-users')
    const data = await res.json()
    return {
        count: data.count
    }
})


export const getSingleUserClient = getUserDataDef.client(async ({ userId }) => {
    const res = await fetch('/api/single-user', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
    })

    const data = await res.json()
    return data.user
})


export const getAllUsersClient = getAllUsersDef.client(async ({query}: {query?: string}) => {
    const res = await fetch('/api/all-users',{
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({query})
    })
    const data = await res.json()
    return data.users
})


export const sendEmailClient = sendEmailDef.client(async ({to,subject,text,html,query}) => {
    const res = await fetch("/api/send-email",{
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            to,
            subject,
            text,
            html,
            query
        })
    })

    if(!res.ok) {
        const error = await res.json()
        throw new Error(error || "Failed to send email")
    }

    const data = await res.json()
    return data
})