import type { Metadata} from "next"
import GridBackground from "@/components/layouts/grid-background";
import CareercastAI from "@/features/careercast-ai";


export const metadata: Metadata = {
  title: 'CareerCast AI'
}

export default function Page() {

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
      <CareercastAI/>
    </GridBackground>
  );
}