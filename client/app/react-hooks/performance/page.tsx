"use client";

import LowerState from "./components/example-3";
import { useId } from "react";
export default function Page() {
  const id = useId();
  console.log(id);

  return <LowerState />;
}
