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
    const viewerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadAssets = async () => {
            try {
                setIsLoading(true);
                const basePath = assets.image_manifest_url?.replace(/\/images\/image_manifest\.json$/, '') || `/books/${id}`;

                // Fetch TeX source
                if (assets.tex_files && assets.tex_files.length > 0) {
                    const texUrl = `${basePath}/tex/${assets.tex_files[0]}`;
                    const res = await fetch(texUrl);
                    if (res.ok) {
                        const text = await res.text();
                        setTexSource(text);
                    }
                }

                // Fetch Image Manifest
                if (assets.image_manifest_url) {
                    const res = await fetch(assets.image_manifest_url);
                    if (res.ok) {
                        const data = await res.json();
                        setImageManifest(data);
                    }
                }

                // Load base.css for webtex-cn (global head is okay now because it's scoped)
                if (typeof document !== 'undefined' && !document.querySelector('link[href="/webtex-css/base.css"]')) {
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = '/webtex-css/base.css';
                    document.head.appendChild(link);
                }
            } catch (error) {
                console.error('Failed to load digital assets:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadAssets();
    }, [id, assets]);

    // Handle standard DOM rendering
    useEffect(() => {
        if (!texSource || !viewerRef.current) return;

        const renderTex = async () => {
            try {
                const webtex = await import(/* webpackIgnore: true */ '/webtex-js/webtex-cn.esm.js');
                if (viewerRef.current) {
                    viewerRef.current.innerHTML = '';
                    webtex.renderToDOM(texSource, viewerRef.current, {
                        cssBasePath: '/webtex-css/'
                    });
                }
            } catch (error) {
                console.error('WebTeX rendering failed:', error);
            }
        };

        renderTex();
    }, [texSource]);

    if (isLoading) {
        return <div className="p-8 text-center text-secondary">加载数字化资源中...</div>;
    }

    const basePath = assets.image_manifest_url?.replace(/\/images\/image_manifest\.json$/, '') || `/books/${id}`;

    return (
        <div className="flex flex-col h-[calc(100vh-180px)] mt-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full pb-8">
                {/* Column 1: TeX Source */}
                <div className="border border-border/60 rounded-xl overflow-hidden flex flex-col bg-white/50 shadow-sm">
                    <div className="bg-paper border-b border-border/60 px-4 py-2.5 text-xs font-bold text-secondary uppercase tracking-widest flex items-center justify-between">
                        <span>TeX 源码</span>
                        <span className="text-[10px] opacity-50 font-mono">{assets.tex_files?.[0]}</span>
                    </div>
                    <pre className="flex-1 overflow-auto p-5 text-sm font-mono text-ink leading-relaxed selection:bg-vermilion/10">
                        {texSource || '无 TeX 源码'}
                    </pre>
                </div>

                {/* Column 2: Rendered View (Scoped Normal HTML/CSS) */}
                <div className="border border-border/60 rounded-xl overflow-hidden flex flex-col bg-white shadow-sm">
                    <div className="bg-paper border-b border-border/60 px-4 py-2.5 text-xs font-bold text-secondary uppercase tracking-widest">
                        WebTeX 排版
                    </div>
                    <div className="flex-1 overflow-auto bg-[#fafafa]">
                        <div ref={viewerRef} className="wtc-scope" />
                        {!texSource && <div className="text-secondary/50 text-sm p-20 text-center">等待渲染...</div>}
                    </div>
                </div>

                {/* Column 3: Images */}
                <div className="border border-border/60 rounded-xl overflow-hidden flex flex-col bg-white/50 shadow-sm">
                    <div className="bg-paper border-b border-border/60 px-4 py-2.5 text-xs font-bold text-secondary uppercase tracking-widest">
                        影印本影像
                    </div>
                    <div className="flex-1 overflow-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-border">
                        {imageManifest?.volumes?.[0]?.files?.slice(0, 20).map((file: any, index: number) => (
                            <div key={index} className="space-y-3 group">
                                <div className="relative overflow-hidden rounded-lg border border-border/40 shadow-sm group-hover:border-vermilion/30 transition-colors">
                                    <img
                                        src={`${basePath}/images/vol01/${file.filename}`}
                                        alt={`Page ${file.page}`}
                                        className="w-full h-auto transition-transform duration-500 group-hover:scale-[1.02]"
                                        loading="lazy"
                                    />
                                </div>
                                <div className="text-center text-xs font-medium text-secondary/70 tracking-wider">
                                    第 {file.page} 页
                                </div>
                            </div>
                        ))}
                        {!imageManifest && <div className="text-sm text-secondary p-4 text-center">无影像资源</div>}
                    </div>
                </div>
            </div>
        </div>
    );
}
