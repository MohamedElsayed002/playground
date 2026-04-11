import prisma from "@/lib/db";
import { deleteUserDef, getUserDataDef, getUsersByNameDef, getUsersCountDef, updateUserDef } from "./definitions";

export const updateUser = updateUserDef.server(async ({ userId, name, lastName, phoneNumber, bio, sex, image }) => {
    const existingUser = await prisma.user.findUnique({
        where: { id: Number(userId) }
    })

    if (!existingUser) {
        throw new Error("User not found")
    }

    const data: {
        name: string
        lastName: string
        phoneNumber: string
        bio?: string | null
        sex?: string | null
        image?: string | null
    } = {
        name: name ?? existingUser.name,
        lastName: lastName ?? existingUser.lastName,
        phoneNumber: phoneNumber ?? existingUser.phoneNumber
    }

    if (bio !== undefined) data.bio = bio
    if (sex !== undefined) data.sex = sex
    if (image !== undefined) data.image = image

    const user = await prisma.user.update({
        where: { id: Number(userId) },
        data
    })

    return {
        userId: user.id,
        name: user.name,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        bio: user.bio ?? undefined,
        sex: user.sex ?? undefined,
        image: user.image ?? undefined
    }
})

export const deleteUser = deleteUserDef.server(async ({ userId }) => {
    const user = await prisma.user.delete({
        where: { id: Number(userId) }
    })

    return {
        deleted: true,
        userId: user.id
    }
})

export const getUsersByName = getUsersByNameDef.server(async ({ name, limit }) => {
    const users = await prisma.user.findMany({
        where: {
            name: {
                contains: name,
                mode: "insensitive"
            }
        },
        take: Number(limit) ?? 5
    })

    return {
        users: users.map((user) => ({
            userId: user.id,
            name: user.name,
            lastName: user.lastName,
            bio: user.bio ?? undefined,
            sex: user.sex ?? undefined,
            image: user.image ?? undefined
        }))
    }
})


export const getTotalUsers = getUsersCountDef.server(async () => {
    const usersCount = await prisma.user.count()
    return {
        count: usersCount
    }
})