import "server-only"
import prisma from "@/lib/db";
import {
  addProductToCartDef,
  checkoutSessionDef,
  deleteUserDef,
  getProductByNameDef,
  getUserDataDef,
  getUsersByNameDef,
  getUsersCountDef,
  updateUserDef,
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

