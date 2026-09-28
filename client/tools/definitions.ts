import { toolDefinition } from "@tanstack/ai";
import { z } from "zod";

export const getAllUsersDef = toolDefinition({
  name: "get_all_users",
  description: "Get all users information",
  inputSchema: z.object({
    query: z.string().optional().describe("query searching for users byy email/username"),
  }),
  outputSchema: z.object({
    users: z.array(
      z.object({
        email: z.string(),
        username: z.string(),
      }),
    ),
  }),
});

export const sendEmailDef = toolDefinition({
  name: "send_email",
  description: "Send an email to one or more users",
  inputSchema: z.object({
    to: z
      .array(z.string().email())
      .min(1)
      .optional()
      .describe("all emails to send them mail/messages"),
    subject: z.string().min(1).describe("email subject"),
    text: z.string().optional().describe("Email text"),
    html: z.string().optional().describe("Email html layout"),
    query: z.string().optional().describe("query searching for users by email/username"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    sentCount: z.number(),
    message: z.string(),
  }),
});

export const getUsersCountDef = toolDefinition({
  name: "get_count_users",
  description: "get the total users we have",
  inputSchema: z.object({
    message: z.string().optional().describe("query about getting users total"),
  }),
  outputSchema: z.object({
    count: z.number(),
  }),
});

export const getUserDataDef = toolDefinition({
  name: "get_user_data",
  description: "Get user data by the id of the user",
  inputSchema: z.object({
    userId: z.coerce.number().describe("The user id"),
  }),
  outputSchema: z.object({
    userId: z.number().optional(),
    name: z.string().optional(),
    lastName: z.string().optional(),
    bio: z.string().optional(),
    sex: z.string().optional(),
    image: z.string().optional(),
  }),
});

export const updateUserDef = toolDefinition({
  name: "update_user",
  description: "Update a user by id with any provided fields",
  inputSchema: z.object({
    userId: z.coerce.number().describe("The user id"),
    name: z.string().optional(),
    lastName: z.string().optional(),
    phoneNumber: z.string().nullable().optional(),
    bio: z.string().nullable().optional(),
    sex: z.string().nullable().optional(),
    image: z.string().nullable().optional(),
  }),
  outputSchema: z.object({
    userId: z.number().optional(),
    name: z.string().optional(),
    lastName: z.string().optional(),
    phoneNumber: z.string().optional(),
    bio: z.string().optional(),
    sex: z.string().optional(),
    image: z.string().optional(),
  }),
});

export const deleteUserDef = toolDefinition({
  name: "delete_user",
  description: "Delete a user by id",
  inputSchema: z.object({
    userId: z.coerce.number().describe("The user id"),
  }),
  outputSchema: z.object({
    deleted: z.boolean(),
    userId: z.number().optional(),
  }),
  needsApproval: true,
  lazy: true,
});

export const getUsersByNameDef = toolDefinition({
  name: "get_users_by_name",
  description: "Get top users matching a name query",
  inputSchema: z.object({
    name: z.string().describe("Name or partial name to search for"),
    limit: z.coerce.number().min(1).max(20).optional().describe("Max results, use 5 or 10"),
  }),
  outputSchema: z.object({
    users: z.array(
      z.object({
        userId: z.number().optional(),
        name: z.string().optional(),
        lastName: z.string().optional(),
        bio: z.string().optional(),
        sex: z.string().optional(),
        image: z.string().optional(),
      }),
    ),
  }),
});


// Small E-commerce

export const getProductByNameDef = toolDefinition({
  name: "get_product_by_name",
  description: "Get top products matches the name query",
  inputSchema: z.object({
    name: z.string().describe("the name of the product"),
  }),
  outputSchema: z.object({
    products: z.array(
      z.object({
        id: z.number(),
        name: z.string(),
        slug: z.string(),
        price: z.string(),
        compare_at_price: z.string().nullable(),
        stock_quantity: z.number(),
        is_featured: z.boolean(),
        owner_id: z.number().nullable().optional(),
        images: z
          .array(
            z.object({
              id: z.number(),
              url: z.string().optional(),
              alt_text: z.string().nullable(),
              is_primary: z.boolean(),
              sort_order: z.number(),
            }),
          )
          .optional(),
        flash_sales: z
          .array(
            z.object({
              id: z.number(),
              product_id: z.number(),
              starts_at: z.string(),
              ends_at: z.string(),
              discount_percentage: z.number(),
              sale_quantity: z.number(),
              remaining_quantity: z.number(),
              status: z.string(),
            }),
          )
          .optional(),
        created_at: z.string(),
      }),
    ),
  }),
});


export const getCategoryByNameDef = toolDefinition({
  name: "get_category_by_name",
  description: "Get the categories by name",
  inputSchema: z.object({
    name: z.string().describe("Get the category by name")
  }),
  outputSchema: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      slug: z.string(),
      description: z.string(),
      image_url: z.string(),
      parent_id: z.any().optional(),
      created_at: z.date()
    })
  )
})


export const addProductToCartDef = toolDefinition({
  name: "add_product_to_cart",
  description: "Add the product to user's cart by product id",
  inputSchema: z.object({
    productId: z.string()
  }),
  outputSchema: z.object({
    message: z.string()
  })
})

export const getCartSummaryDef = toolDefinition({
  name: "get_cart_summary",
  description: "Get the current authenticated user's cart contents, product details, quantities, and subtotal. Use this when the user asks what is in their cart, how many items they have, or their cart subtotal.",
  inputSchema: z.object({}),
  outputSchema: z.object({
    cart: z.object({
      id: z.number(),
      user_id: z.number(),
      subtotal: z.string().nullable(),
      items: z.array(
        z.object({
          id: z.number(),
          quantity: z.number(),
          product: z.object({
            id: z.number(),
            name: z.string(),
            slug: z.string(),
            description: z.string().nullable(),
            short_description: z.string().nullable(),
            price: z.string(),
            compare_at_price: z.string().nullable(),
            stock_quantity: z.number(),
            sku: z.string().nullable(),
            is_active: z.boolean(),
            is_featured: z.boolean(),
            category_id: z.number().nullable(),
            owner_id: z.number().nullable(),
            images: z.array(
              z.object({
                id: z.number(),
                url: z.string(),
                alt_text: z.string().nullable(),
                is_primary: z.boolean(),
                sort_order: z.number(),
              }),
            ),
            created_at: z.string(),
            flash_sales: z.array(
              z.object({
                id: z.number(),
                product_id: z.number(),
                starts_at: z.string(),
                ends_at: z.string(),
                discount_percentage: z.number(),
                sale_quantity: z.number(),
                remaining_quantity: z.number(),
                status: z.string(),
              }),
            ),
          }),
        }),
      ),
    }),
  }),
});

export const getUserOrderHistoryDef = toolDefinition({
  name: "get_user_order_history",
  description: "Get the current authenticated user's recent order history. Use this when the user asks about previous orders, past purchases, recent total spend, or order status.",
  inputSchema: z.object({
    limit: z.coerce.number().min(1).max(20).optional().default(5).describe("Number of recent orders to return"),
  }),
  outputSchema: z.object({
    orders: z.array(
      z.object({
        id: z.number(),
        total: z.string(),
        status: z.string().nullable().optional(),
        created_at: z.string().nullable().optional(),
        items: z
          .array(
            z.object({
              product_name: z.string().nullable().optional(),
              quantity: z.number().nullable().optional(),
              price: z.string().nullable().optional(),
            }),
          )
          .optional(),
      }),
    ),
  }),
});


export const checkoutSessionDef = toolDefinition({
  name: "checkout_session",
  description: "User can checkout out and get the products in his cart",
  inputSchema: z.object({
    notes: z.string().describe("User notes"),
    shipping_address_line1: z.string().describe("user's address 1"),
    shipping_address_line2: z.string().describe("user's address 2").optional(),
    shipping_city: z.string().describe("user's city living in"),
    shipping_country: z.string().describe("user's country living in"),
    shipping_postal_code: z.string().describe("user's house postal code")
  }),
  outputSchema: z.object({
    message: z.string()
  })
})