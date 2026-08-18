"use client"

import { useEffect, useRef, useState, useCallback } from "react"

export type WsStatus = "connecting" | "connected" | "disconnected" | "error"

interface WsMessage {
    type: string
    payload?: any
    timestamp?: string
}

interface UseWebSocketOptions {
    onMessage?: (msg: WsMessage) => void
    reconnectDelay?: number
    enabled?: boolean
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
    const { reconnectDelay = 3000, enabled = true } = options

    // Store onMessage in a ref — never causes re-renders or dep changes
    const onMessageRef = useRef(options.onMessage)
    useEffect(() => { onMessageRef.current = options.onMessage }, [options.onMessage])

    const [status, setStatus] = useState<WsStatus>("disconnected")
    const wsRef = useRef<WebSocket | null>(null)
    const reconnectRef = useRef<NodeJS.Timeout | null>(null)
    const mountedRef = useRef(true)

    const getWsUrl = () => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
        if (apiUrl.startsWith("/")) {
            // Absolute ws/wss URL relative to the browser's current host
            const protocol = typeof window !== "undefined" && window.location.protocol === "https:" ? "wss:" : "ws:"
            const host = typeof window !== "undefined" ? window.location.host : "localhost:3000"
            return `${protocol}//${host}${apiUrl.replace(/\/api$/, "").replace(/\/api\/v\d+$/, "")}/ws`
        }
        return apiUrl.replace(/^http/, "ws").replace(/\/api$/, "").replace(/\/api\/v\d+$/, "") + "/ws"
    }

    // Stable connect — no deps that change on render
    const connect = useCallback(() => {
        if (!mountedRef.current) return
        if (wsRef.current?.readyState === WebSocket.CONNECTING ||
            wsRef.current?.readyState === WebSocket.OPEN) return

        try {
            setStatus("connecting")
            const ws = new WebSocket(getWsUrl())
            wsRef.current = ws

            ws.onopen = () => {
                if (!mountedRef.current) { ws.close(); return }
                setStatus("connected")
                if (reconnectRef.current) {
                    clearTimeout(reconnectRef.current)
                    reconnectRef.current = null
                }
            }

            ws.onmessage = (event) => {
                if (!mountedRef.current) return
                try {
                    const msg: WsMessage = JSON.parse(event.data)
                    onMessageRef.current?.(msg)
                } catch {}
            }

            ws.onclose = () => {
                if (!mountedRef.current) return
                wsRef.current = null
                setStatus("disconnected")
                // Schedule reconnect only once
                if (!reconnectRef.current) {
                    reconnectRef.current = setTimeout(() => {
                        reconnectRef.current = null
                        if (mountedRef.current) connect()
                    }, reconnectDelay)
                }
            }

            ws.onerror = () => {
                // Just close — onclose will handle reconnect
                ws.close()
            }
        } catch {
            setStatus("error")
        }
    }, [reconnectDelay]) // stable — onMessage via ref, enabled checked at call site

    const send = useCallback((type: string, payload?: any) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type, payload }))
        }
    }, [])

    const disconnect = useCallback(() => {
        mountedRef.current = false
        if (reconnectRef.current) { clearTimeout(reconnectRef.current); reconnectRef.current = null }
        wsRef.current?.close()
        wsRef.current = null
        setStatus("disconnected")
    }, [])

    useEffect(() => {
        mountedRef.current = true
        if (enabled) connect()
        return () => {
            mountedRef.current = false
            if (reconnectRef.current) { clearTimeout(reconnectRef.current); reconnectRef.current = null }
            wsRef.current?.close()
            wsRef.current = null
        }
    }, [enabled, connect])

    return { status, send, disconnect, reconnect: connect }
}
