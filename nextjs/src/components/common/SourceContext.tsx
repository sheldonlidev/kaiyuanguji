'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DataSource, GITHUB_BOOK_INDEX, SOURCE_COOKIE_NAME } from '@/lib/constants';

interface SourceContextType {
    source: DataSource;
    setSource: (source: DataSource) => void;
    isAutoDetected: boolean;
    checkConnectivity: () => Promise<void>;
}

const SourceContext = createContext<SourceContextType | undefined>(undefined);

export function SourceProvider({
    children
}: {
    children: React.ReactNode;
}) {
    const [source, setInternalSource] = useState<DataSource>('github');
    const [isAutoDetected, setIsAutoDetected] = useState(false);

    // 设置 cookie
    const setSourceCookie = (src: DataSource) => {
        document.cookie = `${SOURCE_COOKIE_NAME}=${src}; path=/; max-age=${60 * 60 * 24 * 365}`;
    };

    const setSource = useCallback((src: DataSource) => {
        setInternalSource(src);
        setSourceCookie(src);
    }, []);

    const checkConnectivity = useCallback(async () => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            await fetch(GITHUB_BOOK_INDEX, {
                method: 'HEAD',
                mode: 'no-cors',
                signal: controller.signal
            });

            clearTimeout(timeoutId);
        } catch (err) {
            console.warn('GitHub is inaccessible, switching to Gitee source');
            setSource('gitee');
            setIsAutoDetected(true);
        }
    }, [setSource]);

    useEffect(() => {
        // 客户端初始化：先读 Cookie
        const cookies = document.cookie.split('; ');
        const sourceCookie = cookies.find(c => c.startsWith(`${SOURCE_COOKIE_NAME}=`));

        if (sourceCookie) {
            setInternalSource(sourceCookie.split('=')[1] as DataSource);
        } else {
            // 如果没有 Cookie，执行自动检测
            checkConnectivity();
        }
    }, [checkConnectivity]);

    return (
        <SourceContext.Provider value={{ source, setSource, isAutoDetected, checkConnectivity }}>
            {children}
        </SourceContext.Provider>
    );
}

export function useSource() {
    const context = useContext(SourceContext);
    if (context === undefined) {
        throw new Error('useSource must be used within a SourceProvider');
    }
    return context;
}
