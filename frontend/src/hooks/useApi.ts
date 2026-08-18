"use client";

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface FetchState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
}

import { API_BASE_URL } from "@/lib/config"

// Helper to get full URL
const getUrl = (endpoint: string) => {
    if (endpoint.startsWith('http')) return endpoint;
    const baseUrl = API_BASE_URL;

    // Ensure endpoint starts with / if not present
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    // Handle double slashes if baseUrl ends with /
    const finalUrl = baseUrl.endsWith('/')
        ? `${baseUrl.slice(0, -1)}${path}`
        : `${baseUrl}${path}`;

    return finalUrl;
};

export function useApi<T = any>() {
    const [state, setState] = useState<FetchState<T>>({
        data: null,
        loading: false,
        error: null,
    });

    const execute = useCallback(
        async (
            endpoint: string,
            options?: RequestInit,
            showToast = true
        ): Promise<T | null> => {
            setState({ data: null, loading: true, error: null });

            try {
                const url = getUrl(endpoint);
                const response = await fetch(url, {
                    ...options,
                    headers: {
                        'Content-Type': 'application/json',
                        ...options?.headers,
                    },
                });

                const data = await response.json();

                if (!response.ok) {
                    const errorMessage = data.message || data.error || 'Something went wrong';
                    setState({ data: null, loading: false, error: errorMessage });

                    if (showToast) {
                        toast.error(errorMessage);
                    }
                    return null;
                }

                setState({ data, loading: false, error: null });
                return data;
            } catch (error: any) {
                const errorMessage = error.message || 'Network error occurred';
                setState({ data: null, loading: false, error: errorMessage });

                if (showToast) {
                    toast.error(errorMessage);
                }
                return null;
            }
        },
        []
    );

    const reset = useCallback(() => {
        setState({ data: null, loading: false, error: null });
    }, []);

    return {
        ...state,
        execute,
        reset,
    };
}

// Helper functions for common HTTP methods
export const api = {
    get: async (endpoint: string) => {
        const url = getUrl(endpoint);
        const res = await fetch(url);
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Request failed');
        }
        return res.json();
    },

    post: async (endpoint: string, data: any) => {
        const url = getUrl(endpoint);
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Request failed');
        }
        return res.json();
    },

    put: async (endpoint: string, data: any) => {
        const url = getUrl(endpoint);
        const res = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Request failed');
        }
        return res.json();
    },

    delete: async (endpoint: string) => {
        const url = getUrl(endpoint);
        const res = await fetch(url, { method: 'DELETE' });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Request failed');
        }
        return res.json();
    },
};
