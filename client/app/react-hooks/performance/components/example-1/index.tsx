"use client";

import List from "./list";
import Counter from "./counter";

const data = [
  { id: 1, name: "Mohamed" },
  { id: 2, name: "Elsayed" },
  { id: 3, name: "Ali" },
];

export default function LowerState() {
  // const [people, setPeople] = useState(data)

  return (
    <section>
      <Counter />
      <List people={data} />
    </section>
  );
}
