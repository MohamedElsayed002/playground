import { createLoader, parseAsFloat } from "nuqs/server";

export const locationParsers = {
  lat: parseAsFloat.withDefault(0),
  lang: parseAsFloat.withDefault(0),
};

export const loadLocationSearchParams = createLoader(locationParsers);
