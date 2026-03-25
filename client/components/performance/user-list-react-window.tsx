"use client"

// uninstalled react-window@1.8.7 
import { CSSProperties } from "react"
import { FixedSizeList as List } from "react-window"



export default function UsersList({ users }: { users: { image: string | null; name: string; lastName: string; bio: string | null }[] }) {

    const Row = ({ index, style }: { index: number, style: CSSProperties }) => {
        const user = users[index]
        return (
            <div style={{ ...style, padding: 10, borderBottom: "1px solid #ccc" }}>
                {/* <img
                    src={user.image}
                    alt={user.name}
                    loading="lazy"
                    style={{ width: 50, height: 50, borderRadius: "50%" }}
                /> */}
                <div>
                    <strong>{user.name} {user.lastName}</strong>
                    <p>{user.bio}</p>
                </div>
            </div>
        )
    }

    return (
        <List
            height={1000}
            itemCount={users.length}
            itemSize={100}
            width={"100%"}
        >
            {Row}
        </List>
    )
}