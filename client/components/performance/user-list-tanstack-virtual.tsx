"use client"

import { useRef } from "react"
import { useVirtualizer} from "@tanstack/react-virtual"

export default function UsersList({users} : { users: { image: string | null; name: string; lastName: string; bio: string | null }[] }) {

    const parentRef = useRef<HTMLDivElement>(null)

    const rowVirtualizer = useVirtualizer({
        count: users.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 100,
        overscan: 5
    })

    return (
        <div 
            ref={parentRef}
            style={{
                height: "800px",
                overflow: "auto",
                border: "1px solid #ddd"
            }}
        >
            <div 
                style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    position: 'relative'
                }}
            >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const user = users[virtualRow.index]

                    return (
                        <div
                            key={user.name}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: `${virtualRow.size}px`,
                                transform: `translateY(${virtualRow.start}px)`,
                                display: 'flex',
                                gap:'10px',
                                padding: '10px',
                                borderBottom:'1px solid #eee'
                            }}
                        >
                            <img loading="lazy" src={user.image} alt={user.name} style={{width:50,height:50,borderRadius: '50%',objectFit: "cover"}} />
                            <div>
                                <strong>{user.name} {user.lastName}</strong>
                                <p style={{margin: 0}}>{user.bio}</p>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}