"use client";

import { useQueryStates } from "nuqs";
import { booleanCodec, numberCodec, stringCodec } from "@/lib/codecs";

export type ProductQueryParams = {
  search: string;
  category_id: number;
  featured: boolean;
  page: number;
  page_size: number;
};

export function useProductQueryParams() {
  return useQueryStates(
    {
      search: {
        parse: (value: string) => {
          try {
            return stringCodec.decode(value);
          } catch {
            return "";
          }
        },
        serialize: (value: string) => stringCodec.encode(value),
        defaultValue: "",
      },
      category_id: {
        parse: (value: string) => {
          try {
            return numberCodec.decode(value);
          } catch {
            return 0;
          }
        },
        serialize: (value: number) => numberCodec.encode(value),
        defaultValue: 0,
      },
      featured: {
        parse: (value: string) => {
          try {
            if (value !== "true" && value !== "false") return false;
            return booleanCodec.decode(value);
          } catch {
            return false;
          }
        },
        serialize: (value: boolean) => booleanCodec.encode(value),
        defaultValue: false,
      },
      page: {
        parse: (value: string) => {
          try {
            return numberCodec.decode(value);
          } catch {
            return 1;
          }
        },
        serialize: (value: number) => numberCodec.encode(value),
        defaultValue: 1,
      },
      page_size: {
        parse: (value: string) => {
          try {
            return numberCodec.decode(value);
          } catch {
            return 10;
          }
        },
        serialize: (value: number) => numberCodec.encode(value),
        defaultValue: 10,
      },
    },
    {
      urlKeys: {
        search: "search",
        category_id: "category_id",
        featured: "featured",
        page: "page",
        page_size: "page_size",
      },
      shallow: false,
    },
  );
}
