import { useState, useEffect, type JSX } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Base(props: { children: React.ReactNode }): JSX.Element {  
    const { children } = props;
    
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mq = window.matchMedia('(max-width: 639px)');
        if (mq.matches) setSidebarOpen(false);
    }, []);

    return (
        <div className="flex flex-col h-screen font-sans text-slate-900 bg-slate-50">
            <Topbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            <div className="flex-1 flex overflow-hidden">
                <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
                <main className="flex-1 overflow-auto">{children}</main>
            </div>
        </div>
    );
}