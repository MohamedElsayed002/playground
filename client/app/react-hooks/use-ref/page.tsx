"use client";

import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";

export default function Page() {
  const [value, setValue] = useState(0);
  const containerRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (!containerRef.current) return;
    const name = containerRef.current.value;
    console.log(name);
  };

  // useEffect(() => {
  //     console.log(containerRef)
  // },[])

  return (
    <div>
      <form onSubmit={() => handleSubmit}>
        <label htmlFor="name">Name</label>
        <input type="text" id="name" ref={containerRef} />
        <Button type="submit">Submit</Button>
      </form>

      <h1>{value}</h1>
      <Button onClick={() => setValue((prev) => prev + 1)}>+</Button>
      <Button onClick={() => setValue((prev) => prev - 1)}>-</Button>
    </div>
  );
}
