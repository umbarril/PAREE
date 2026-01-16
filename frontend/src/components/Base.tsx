import { useState, type JSX } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Base(props: { children: React.ReactNode }): JSX.Element {  
    const { children } = props;
    
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="flex flex-col h-screen font-sans text-slate-900 bg-slate-50">
            <Topbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            <div className="flex-1 flex">
                <Sidebar sidebarOpen={sidebarOpen}/>
                {children}
            </div>
        </div>
    );
}