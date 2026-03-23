import { getUserDataDef, getUsersCountDef } from "./definitions"



export const getTotalUsersClient = getUsersCountDef.client(async () => {
    const res = await fetch('/api/total-users')
    const data = await res.json()
    return {
        count: data.count
    }
})


export const getSingleUserClient = getUserDataDef.client(async ({ userId }) => {
    console.log('useridddd',userId)
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