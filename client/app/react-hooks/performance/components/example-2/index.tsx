"use client"

import { useState } from "react"
import List from "./list"
import { sileo } from "sileo"
import Form from "./form"

const data = [
    { id: 1, name: 'Mohamed' },
    { id: 2, name: 'Elsayed' },
    { id: 3, name: 'Ali' }
]

export default function LowerState() {
    const [people, setPeople] = useState(data)


    const addPerson = (name: string) => {
        const fakeId = people.length + 1
        const newPerson = { id: fakeId, name }
        setPeople([...people, newPerson])
    }

    return (
        <section>
            <Form addPerson={addPerson}/>
            <List people={people} />
        </section>
    )
}