"use client";

import { FormEvent, useState } from "react";
import { sileo } from "sileo";

function Form({ addPerson }: { addPerson: (name: string) => void }) {
  const [name, setName] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name) {
      sileo.error({
        title: "Error",
      });
      return;
    }
    addPerson(name);
    setName("");
  };

  return (
    <div>
      <form className="form" onSubmit={handleSubmit}>
        <div className="form-row">
          <label htmlFor="name" className="form-label">
            name
          </label>
          <input
            type="text"
            name="name"
            id="name"
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <button className="btn btn-block" type="submit">
          submit
        </button>
      </form>
    </div>
  );
}

export default Form;
