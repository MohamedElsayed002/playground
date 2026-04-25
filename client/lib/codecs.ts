import { z } from "zod";

export const stringCodec = z.codec(z.string(), z.string(), {
  decode: (v) => v,
  encode: (v) => v,
});

export const numberCodec = z.codec(z.string().regex(/^\d+$/), z.number(), {
  decode: (v) => parseInt(v),
  encode: (v) => v.toString(),
});

export const sortCodec = z.codec(
  z.string().regex(/^[a-zA-Z0-9_]+\.(asc|desc)$/),
  z.object({
    id: z.string(),
    desc: z.boolean(),
  }),
  {
    decode: (v) => {
      const [id, dir] = v.split(".");
      return { id, desc: dir === "desc" };
    },
    encode: ({ id, desc }) => `${id}.${desc ? "desc" : "asc"}`,
  },
);

export const booleanCodec = z.codec(z.enum(["true", "false"]), z.boolean(), {
  decode: (v) => v === "true",
  encode: (v) => (v ? "true" : "false"),
});
