'use client';

import { useState, useEffect, useRef } from 'react';
import { DigitalAssets } from '@/types';

interface DigitalizationViewProps {
    id: string;
    assets: DigitalAssets;
}

export default function DigitalizationView({ id, assets }: DigitalizationViewProps) {
    const [texSource, setTexSource] = useState<string>('');
    const [imageManifest, setImageManifest] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [renderError, setRenderError] = useState<string | null>(null);
    const viewerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadAssets = async () => {
            try {
                setIsLoading(true);

                // Derive base path from manifest URL: /local-data/Book/C/X/E/ID/images/image_manifest.json -> /local-data/Book/C/X/E/ID
                const basePath = assets.image_manifest_url?.replace(/\/images\/image_manifest\.json$/, '') || `/books/${id}`;

                // Load base.css for webtex-cn
                if (typeof document !== 'undefined' && !document.querySelector('link[href="/webtex-css/base.css"]')) {
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = '/webtex-css/base.css';
                    document.head.appendChild(link);
                }

                // 1. Fetch TeX source
                if (assets.tex_files && assets.tex_files.length > 0) {
                    const texUrl = `${basePath}/tex/${assets.tex_files[0]}`;
                    const res = await fetch(texUrl);
                    if (res.ok) {
                        const text = await res.text();
                        setTexSource(text);
                    }
                }

                // 2. Fetch Image Manifest
                if (assets.image_manifest_url) {
                    const res = await fetch(assets.image_manifest_url);
                    if (res.ok) {
                        const data = await res.json();
                        setImageManifest(data);
                    }
                }
            } catch (error) {
                console.error('Failed to load digital assets:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadAssets();
    }, [id, assets]);

    useEffect(() => {
        if (!texSource || !viewerRef.current) return;

        // Dynamic import from public directory at runtime
        const renderTex = async () => {
            try {
                const webtex = await import(/* webpackIgnore: true */ '/webtex-js/webtex-cn.esm.js');
                webtex.renderToDOM(texSource, viewerRef.current!, {
                    cssBasePath: '/webtex-css/'
                });
            } catch (error) {
                console.error('WebTeX rendering failed:', error);
                setRenderError(String(error));
            }
        };
        renderTex();
    }, [texSource]);

    if (isLoading) {
        return <div className="p-8 text-center text-secondary">加载数字化资源中...</div>;
    }

    const basePath = assets.image_manifest_url?.replace(/\/images\/image_manifest\.json$/, '') || `/books/${id}`;

    return (
        <div className="flex flex-col h-[calc(100vh-250px)] mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
                {/* Column 1: TeX Source */}
                <div className="border border-border/40 rounded-xl overflow-hidden flex flex-col bg-paper/10">
                    <div className="bg-paper border-b border-border/40 px-4 py-2 text-xs font-semibold text-secondary uppercase tracking-wider">
                        TeX 源码
                    </div>
                    <pre className="flex-1 overflow-auto p-4 text-sm font-mono text-ink leading-relaxed">
                        {texSource || '无 TeX 源码'}
                    </pre>
                </div>

                {/* Column 2: Rendered View */}
                <div className="border border-border/40 rounded-xl overflow-hidden flex flex-col bg-white">
                    <div className="bg-paper border-b border-border/40 px-4 py-2 text-xs font-semibold text-secondary uppercase tracking-wider">
                        WebTeX 排版
                    </div>
                    <div className="flex-1 overflow-auto bg-[#f8f8f8]">
                        <div ref={viewerRef} className="webtex-viewer p-4">
                            {/* WebTeX content will be injected here */}
                        </div>
                    </div>
                </div>

                {/* Column 3: Images */}
                <div className="border border-border/40 rounded-xl overflow-hidden flex flex-col bg-paper/10">
                    <div className="bg-paper border-b border-border/40 px-4 py-2 text-xs font-semibold text-secondary uppercase tracking-wider">
                        影印本影像
                    </div>
                    <div className="flex-1 overflow-auto p-4 space-y-4">
                        {imageManifest?.volumes?.[0]?.files?.slice(0, 10).map((file: any, index: number) => (
                            <div key={index} className="space-y-2">
                                <img
                                    src={`${basePath}/images/vol01/${file.filename}`}
                                    alt={`Page ${file.page}`}
                                    className="w-full rounded border border-border/40 shadow-sm"
                                    loading="lazy"
                                />
                                <div className="text-center text-xs text-secondary">
                                    第 {file.page} 页
                                </div>
                            </div>
                        ))}
                        {!imageManifest && <div className="text-sm text-secondary">无影像资源</div>}
                    </div>
                </div>
            </div>
        </div>
    );
}
