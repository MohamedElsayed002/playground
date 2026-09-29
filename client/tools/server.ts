import "server-only"
import prisma from "@/lib/db";
import {
  addProductToCartDef,
  checkoutSessionDef,
  deleteUserDef,
  getProductByNameDef,
  getCartSummaryDef,
  getUserDataDef,
  getUserOrderHistoryDef,
  getUsersByNameDef,
  getUsersCountDef,
  updateUserDef,
  getProductDetails,
  removeProductFromCartDef,
} from "./definitions";
import { api } from "@/lib/api/client";

import { cookies } from "next/headers";

export const getUserData = getUserDataDef.server(async ({ userId }) => {
  const user = await prisma.user.findUnique({
    where: {
      id: Number(userId),
    },
  });

  return {
    userId: user?.id,
    image: user?.image ?? undefined,
    bio: user?.bio ?? undefined,
    name: user?.name,
    lastName: user?.lastName,
  };
});

export const updateUser = updateUserDef.server(
  async ({ userId, name, lastName, phoneNumber, bio, sex, image }) => {
    const existingUser = await prisma.user.findUnique({
      where: { id: Number(userId) },
    });

    if (!existingUser) {
      throw new Error("User not found");
    }

    const data: {
      name: string;
      lastName: string;
      phoneNumber: string;
      bio?: string | null;
      sex?: string | null;
      image?: string | null;
    } = {
      name: name ?? existingUser.name,
      lastName: lastName ?? existingUser.lastName,
      phoneNumber: phoneNumber ?? existingUser.phoneNumber,
    };

    if (bio !== undefined) data.bio = bio;
    if (sex !== undefined) data.sex = sex;
    if (image !== undefined) data.image = image;

    const user = await prisma.user.update({
      where: { id: Number(userId) },
      data,
    });

    return {
      userId: user.id,
      name: user.name,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      bio: user.bio ?? undefined,
      sex: user.sex ?? undefined,
      image: user.image ?? undefined,
    };
  },
);

export const deleteUser = deleteUserDef.server(async ({ userId }) => {
  const user = await prisma.user.delete({
    where: { id: Number(userId) },
  });

  return {
    deleted: true,
    userId: user.id,
  };
});

export const getUsersByName = getUsersByNameDef.server(async ({ name, limit }) => {
  const users = await prisma.user.findMany({
    where: {
      name: {
        contains: name,
        mode: "insensitive",
      },
    },
    take: Number(limit) ?? 5,
  });

  return {
    users: users.map((user) => ({
      userId: user.id,
      name: user.name,
      lastName: user.lastName,
      bio: user.bio ?? undefined,
      sex: user.sex ?? undefined,
      image: user.image ?? undefined,
    })),
  };
});

export const getTotalUsers = getUsersCountDef.server(async () => {
  const usersCount = await prisma.user.count();
  return {
    count: usersCount,
  };
});



//  Small E-commerce

export const getProductByName = getProductByNameDef.server(async ({ name }) => {
  const products = await api.GET("/api/v1/products", {
    params: {
      query: {
        search: name,
      },
    },
  });

  return {
    products: products.data?.items ?? [],
  };
});


// export const getCategoryByName = getCategoryByNameDef.server(async ({name}) => {
//   const category = await api.GET('/api/v1/categories',{
//     params: {
//       query: {

//       }
//     }
//   })
// })

export const addProductToCart = addProductToCartDef.server(async ({ productId }: { productId: string }) => {

  const accessToken = (await cookies()).get("fastapi_access")?.value

  const product = await api.POST("/api/v1/orders/cart/items", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: {
      product_id: Number(productId),
      quantity: 1,
    },
  });

  return {
    message: product.data?.message ?? "Product successfully added to cart",
  };
});

export const getCartSummary = getCartSummaryDef.server(async () => {
  const accessToken = (await cookies()).get("fastapi_access")?.value;

  if (!accessToken) {
    throw new Error("User is not authenticated.");
  }

  const response = await api.GET("/api/v1/orders/cart", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.data) {
    throw new Error("Unable to load your cart right now.");
  }

  return {
    cart: {
      id: response.data.id,
      user_id: response.data.user_id,
      subtotal: response.data.subtotal ?? null,
      items: (response.data.items ?? []).map(({ id, quantity, product }) => ({
        id,
        quantity,
        product: {
          ...product,
          images: product.images ?? [],
          flash_sales: product.flash_sales ?? [],
        },
      })),
    },
  };
});

export const getUserOrderHistory = getUserOrderHistoryDef.server(async ({ limit = 5 }) => {
  const accessToken = (await cookies()).get("fastapi_access")?.value;

  if (!accessToken) {
    throw new Error("User is not authenticated.");
  }

  const response = await api.GET("/api/v1/orders/my", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    params: {
      query: {
        page_size: Number(limit),
        page: 1,
      },
    },
  });

  const items = (response.data?.items ?? []) as Array<{
    id?: number;
    total?: string;
    status?: string | null;
    created_at?: string | null;
    items?: Array<{
      product_name?: string | null;
      quantity?: number | null;
      price?: string | null;
    }>;
  }>;

  return {
    orders: items.map((order) => ({
      id: order.id ?? 0,
      total: order.total ?? "0.00",
      status: order.status ?? "unknown",
      created_at: order.created_at ?? null,
      items: (order.items ?? []).map((item) => ({
        product_name: item.product_name ?? "Product",
        quantity: item.quantity ?? 1,
        price: item.price ?? "0.00",
      })),
    })),
  };
});


export const checkoutCart = checkoutSessionDef.server(async ({
  shipping_address_line1,
  shipping_address_line2,
  notes,
  shipping_city,
  shipping_country,
  shipping_postal_code,
}: {
  shipping_address_line1: string;
  shipping_address_line2?: string;
  notes: string;
  shipping_city: string;
  shipping_country: string;
  shipping_postal_code: string;
}) => {
  const accessToken = (await cookies()).get("fastapi_access")?.value;

  await api.POST("/api/v1/orders/testing-route", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: {
      notes,
      shipping_address_line1,
      shipping_address_line2,
      shipping_city,
      shipping_country,
      shipping_postal_code,
    },
  });

  return {
    message: "ALL GOOD",
  };
});


export const getSingleProductDetailsServer = getProductDetails.server(async ({ productId }: { productId: string }) => {
  const response = await api.GET('/api/v1/products/{product_id}', {
    params: {
      path: {
        product_id: Number(productId)
      }
    }
  })

  if (!response.data) {
    throw new Error(`Product ${productId} was not found`)
  }

  return response.data
})


export const deleteProductFromCartServer = removeProductFromCartDef.server(async ({ productId }: { productId: string }) => {
  const accessToken = (await cookies()).get("fastapi_access")?.value

  const response = await api.DELETE('/api/v1/orders/cart/items/{product_id}', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    params: {
      path: {
        product_id: Number(productId)
      }
    }
  })

  if (response.error || !response.data) {
    throw new Error("Product not found")
  }

  return { message: "Product successfully removed from cart" }
})