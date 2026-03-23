import { toolDefinition } from "@tanstack/ai"
import { z } from "zod"


export const getUsersCountDef = toolDefinition({
    name: "get_count_users",
    description: "get the total users we have",
    inputSchema: z.object({
        message: z.string().describe("query about getting users total")
    }),
    outputSchema: z.object({
        count: z.number()
    })
})

export  const getUserDataDef = toolDefinition({
    name: "get_user_data",
    description: "Get user data by the id of the user",
    inputSchema: z.object({
        userId: z.number().describe("The user id")
    }),
    outputSchema: z.object({
        userId: z.number().optional(),
        name: z.string().optional(),
        lastName:z.string().optional(),
        bio:z.string().optional(),
        sex: z.string().optional(),
        image: z.string().optional()
    })
})

export const updateUserDef = toolDefinition({
    name: "update_user",
    description: "Update a user by id with any provided fields",
    inputSchema: z.object({
        userId: z.number().describe("The user id"),
        name: z.string().optional(),
        lastName: z.string().optional(),
        phoneNumber: z.string().optional(),
        bio: z.string().optional(),
        sex: z.string().optional(),
        image: z.string().optional()
    }),
    outputSchema: z.object({
        userId: z.number().optional(),
        name: z.string().optional(),
        lastName: z.string().optional(),
        phoneNumber: z.string().optional(),
        bio: z.string().optional(),
        sex: z.string().optional(),
        image: z.string().optional()
    })
})

export const deleteUserDef = toolDefinition({
    name: "delete_user",
    description: "Delete a user by id",
    inputSchema: z.object({
        userId: z.number().describe("The user id")
    }),
    outputSchema: z.object({
        deleted: z.boolean(),
        userId: z.number().optional()
    }),
    needsApproval: true
})

export const getUsersByNameDef = toolDefinition({
    name: "get_users_by_name",
    description: "Get top users matching a name query",
    inputSchema: z.object({
        name: z.string().describe("Name or partial name to search for"),
        limit: z.number().min(1).max(20).optional().describe("Max results, use 5 or 10")
    }),
    outputSchema: z.object({
        users: z.array(
            z.object({
                userId: z.number().optional(),
                name: z.string().optional(),
                lastName: z.string().optional(),
                bio: z.string().optional(),
                sex: z.string().optional(),
                image: z.string().optional()
            })
        )
    })
})
