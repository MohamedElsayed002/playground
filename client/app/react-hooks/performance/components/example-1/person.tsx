"use client"

import { useEffect } from "react";

export default function Person({name}: {name: string}) {
    console.log('render')

    return (
        <div>
            <h4>{name}</h4>
        </div>
    )
}