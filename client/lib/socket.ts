import { io, Socket } from 'socket.io-client'
import { API_URL } from './api'

let socket: Socket | null = null

export function getSocket(profileId: string): Socket {

    if(!socket) {
        socket = io(`${API_URL}/chat`,{
            auth: {user_id: profileId},
            transports: ['websocket'],
            autoConnect: true
        })
    }
    return socket
}

export function disconnectSocket(): void {
    socket?.disconnect()
    socket = null
}