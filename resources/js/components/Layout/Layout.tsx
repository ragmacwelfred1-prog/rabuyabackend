// resources/js/components/Layout/Layout.tsx
import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
    children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);

    const toggleSidebar = () => {
        setCollapsed(!collapsed);
    };

    // Sync background with theme
    useEffect(() => {
        const isDark =
            localStorage.getItem('theme') === 'dark' ||
            document.documentElement.getAttribute('data-theme') === 'dark';
        document.body.style.backgroundColor = isDark ? '#0F172A' : '#F8FAFC';
    }, []);

    return (
        <div className="app">
            <Sidebar collapsed={collapsed} onToggle={toggleSidebar} />
            <div className={`main-content ${collapsed ? 'collapsed' : ''}`}>
                <Header />
                <div className="content fade-in">{children || <Outlet />}</div>
            </div>
        </div>
    );
};

export default Layout;
