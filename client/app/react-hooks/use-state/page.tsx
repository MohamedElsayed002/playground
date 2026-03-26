'use client'

import React, { FormEvent, useState } from "react"

const info = [
    { id: 1, name: 'Mohamed', email: 'mo@gmail.com' },
    { id: 2, name: 'Elsayed', email: 'elsayed@gmail.com' },
    { id: 3, name: 'Ali', email: 'ali@gmail.com' },
]

export default function Page() {

    const [data, setData] = useState(info || [])

    const [userInfo, setUserInfo] = useState({
        name: '',
        email: '',
        password: ''
    })

    const removeItem = (id: number) => {
        const filteredData = data.filter((item) => item.id !== id)
        setData(filteredData)
    }

    const clearData = () => {
        setData([])
    }

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        console.log(userInfo)
    }

    return (
        <div>
            {data.map((item) => {

                const { id, name, email } = item

                return (
                    <div key={id}>
                        <h1>{name}</h1>
                        <h1>{email}</h1>
                        <button onClick={() => removeItem(id)}>Remove</button>
                    </div>
                )
            })}

            <button onClick={() => clearData()}>
                Clear Data
            </button>
            <button onClickCapture={() => setData(info)}>
                Restore data
            </button>

            <div>
                <h1>User Info</h1>
                <div>
                    <form>
                        <input
                            value={userInfo.name}
                            onChange={(e) => setUserInfo((prev) => ({ ...prev, name: e.target.value }))}
                            tabIndex={1}
                            autoFocus={true}
                        />
                        <input
                            value={userInfo.email}
                            onChange={(e) => setUserInfo((prev) => ({ ...prev, email: e.target.value }))}
                            tabIndex={2}
                       />

                        <input
                            value={userInfo.password}
                            onChange={(e) => setUserInfo((prev) => ({ ...prev, password: e.target.value }))}
                            tabIndex={4}
                        />
                        <button aria-label="submit-button" tabIndex={3} type='submit' onClick={handleSubmit}>
                            Submit
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}