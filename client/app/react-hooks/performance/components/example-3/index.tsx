"use client";

import { useCallback, useState } from "react";
import List from "./list";
const data: { id: number; name: string }[] = [
  { id: 1, name: "Mohamed" },
  { id: 2, name: "Elsayed" },
  { id: 3, name: "Ali" },
];

export default function LowerState() {
  const [people, setPeople] = useState(data);
  const [count, setCount] = useState(0);

  const removeUser = useCallback(
    (id: number) => {
      const newPeople = people.filter((person) => person.id !== id);
      setPeople(newPeople);
    },
    [people],
  );

  return (
    <section>
      <button className="btn" onClick={() => setCount(count + 1)} style={{ marginBottom: "1rem" }}>
        count {count}
      </button>
      <List people={people} removeUser={removeUser} />
    </section>
  );
}
