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
    const [renderStatus, setRenderStatus] = useState<string>('等待数据...');
    const viewerRef = useRef<HTMLDivElement>(null);

    // Load assets
    useEffect(() => {
        const loadAssets = async () => {
            try {
                setIsLoading(true);
                const basePath = assets.image_manifest_url?.replace(/\/images\/image_manifest\.json$/, '') || `/books/${id}`;

                if (assets.tex_files && assets.tex_files.length > 0) {
                    const texUrl = `${basePath}/tex/${assets.tex_files[0]}`;
                    setRenderStatus(`正在获取: ${texUrl}`);
                    const res = await fetch(texUrl);
                    if (res.ok) {
                        const text = await res.text();
                        setTexSource(text);
                        setRenderStatus(`获取成功, ${text.length} 字符`);
                    } else {
                        setRenderStatus(`获取失败: HTTP ${res.status}`);
                    }
                } else {
                    setRenderStatus('无 TeX 文件');
                }

                if (assets.image_manifest_url) {
                    const res = await fetch(assets.image_manifest_url);
                    if (res.ok) {
                        const data = await res.json();
                        setImageManifest(data);
                    }
                }
            } catch (error) {
                console.error('Failed to load digital assets:', error);
                setRenderStatus(`加载失败: ${error}`);
            } finally {
                setIsLoading(false);
            }
        };

        loadAssets();
    }, [id, assets]);

    // Render WebTeX — depends on both texSource AND isLoading,
    // because the viewerRef div only exists when isLoading is false.
    useEffect(() => {
        if (isLoading || !texSource) {
            return;
        }
        if (!viewerRef.current) {
            setRenderStatus('viewerRef 未挂载');
            return;
        }

        setRenderStatus('正在加载 webtex-cn 库...');

        const renderTex = async () => {
            try {
                // Ensure base.css is loaded
                if (!document.querySelector('link[href="/webtex-css/base.css"]')) {
                    const baseLink = document.createElement('link');
                    baseLink.rel = 'stylesheet';
                    baseLink.href = '/webtex-css/base.css';
                    document.head.appendChild(baseLink);
                }

                const module = await import(/* webpackIgnore: true */ '/webtex-js/webtex-cn.esm.js');
                const webtex = module.renderToDOM ? module : module.default;

                if (!webtex || typeof webtex.renderToDOM !== 'function') {
                    setRenderStatus(`模块加载失败: renderToDOM 不存在。keys=${Object.keys(module).join(',')}`);
                    return;
                }

                setRenderStatus('正在排版...');

                if (viewerRef.current) {
                    webtex.renderToDOM(texSource, viewerRef.current, {
                        cssBasePath: '/webtex-css/'
                    });

                    const count = viewerRef.current.children.length;
                    setRenderStatus(`排版完成, ${count} 个元素`);
                }
            } catch (error) {
                const msg = error instanceof Error ? error.message : String(error);
                setRenderStatus(`排版失败: ${msg}`);
                console.error('[DigitalizationView] Render error:', error);
            }
        };

        renderTex();
    }, [texSource, isLoading]);

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

                {/* Column 2: Rendered View */}
                <div className="border border-border/60 rounded-xl overflow-hidden flex flex-col bg-white shadow-sm">
                    <div className="bg-paper border-b border-border/60 px-4 py-2.5 text-xs font-bold text-secondary uppercase tracking-widest flex items-center justify-between">
                        <span>WebTeX 排版</span>
                        <span className="text-[10px] text-vermilion font-mono">{renderStatus}</span>
                    </div>
                    <div className="flex-1 overflow-auto bg-[#fafafa]">
                        <div
                            ref={viewerRef}
                            className="wtc-scope"
                        />
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
