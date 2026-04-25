"use client";

import { useEffect, useState } from "react";
import GridBackground from "@/components/layouts/grid-background";
import Link from "next/link";
import { RoughNotation } from "react-rough-notation";

export default function Page() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
  }, []);

  return (
    <GridBackground
      className="min-h-dvh bg-gray-300 dark:bg-zinc-950"
      squares={[
        [2, 1],
        [5, 2],
        [8, 1],
        [1, 5],
        [4, 6],
        [9, 6],
        [12, 4],
        [14, 8],
        [6, 10],
      ]}
    >
      <main className="min-h-screen grid place-items-center">
        <div className="text-center">
          <RoughNotation
            type="bracket"
            show={show}
            brackets={["left", "right"]}
            color="#f97316"
            strokeWidth={3}
          >
            <h1 className="text-7xl font-bold">Under Construction 🚧</h1>
          </RoughNotation>
          <p>
            Project Demo:{" "}
            <Link
              className="underline text-blue-500"
              href="https://florist-nextjs-neon.vercel.app/en"
            >
              Flower Obsession
            </Link>
          </p>
        </div>
      </main>
    </GridBackground>
  );
}
