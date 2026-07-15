import { ReactNode, useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import { AppNotification, notificationService } from '../services/notificationService';
import { LogOut, LayoutDashboard, FileText, Calendar, User as UserIcon, GraduationCap } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  menuItems: { path: string; label: string; icon: any }[];
}

export const Layout = ({ children, menuItems }: LayoutProps) => {
  const { profile, clearSession } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notificationError, setNotificationError] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profile?.user_id) return;

    const loadNotifications = () => {
      notificationService.getMine()
        .then((items) => {
          setNotifications(items);
          setNotificationError(false);
        })
        .catch(() => setNotificationError(true));
    };

    loadNotifications();
    const interval = window.setInterval(loadNotifications, 30000);
    return () => window.clearInterval(interval);
  }, [profile?.user_id]);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!notificationRef.current?.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  const toggleNotifications = async () => {
    const nextOpen = !isNotificationOpen;
    setIsNotificationOpen(nextOpen);

    if (nextOpen && profile?.user_id) {
      try {
        const latestNotifications = await notificationService.getMine();
        setNotifications(latestNotifications);
        await notificationService.markAllAsRead();
        setNotifications((items) => items.map((item) => ({ ...item, is_read: true })));
        setNotificationError(false);
      } catch {
        setNotificationError(true);
      }
    }
  };

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  const handleLogout = async () => {
    await authService.signOut();
    clearSession();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <GraduationCap className="w-8 h-8 text-primary mr-3" />
          <span className="font-bold text-xl text-text">TutorSys</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 rounded-xl font-medium transition-colors ${
                      isActive 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-secondary-text hover:bg-gray-50 hover:text-text'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-border">
          <div className="flex items-center px-4 py-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold mr-3">
              {profile?.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="text-sm font-semibold text-text truncate w-32">{profile?.full_name}</p>
              <p className="text-xs text-secondary-text capitalize">{profile?.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-secondary-text hover:bg-red-50 hover:text-danger rounded-xl transition-colors font-medium"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="h-16 bg-card border-b border-border flex md:hidden items-center justify-between px-4">
          <div className="flex items-center">
            <GraduationCap className="w-6 h-6 text-primary mr-2" />
            <span className="font-bold text-lg text-text">TutorSys</span>
          </div>
          <button onClick={handleLogout} className="p-2 text-secondary-text">
            <LogOut className="w-5 h-5" />
          </button>
        </header>
        
        {/* Desktop Header */}
        <header className="h-16 bg-card border-b border-border hidden md:flex items-center justify-between px-8">
          <h2 className="text-xl font-semibold text-text">Welcome back, {profile?.full_name?.split(' ')[0]}</h2>
          <div className="flex items-center space-x-4">
            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={toggleNotifications}
                aria-label="Notifications"
                aria-expanded={isNotificationOpen}
                className="relative w-10 h-10 rounded-full border border-border flex items-center justify-center text-secondary-text hover:bg-gray-50"
              >
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>

              {isNotificationOpen && (
                <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                  <div className="border-b border-border px-4 py-3 font-semibold text-text">Notifications</div>
                  <div className="max-h-80 overflow-y-auto">
                    {notificationError ? (
                      <p className="px-4 py-5 text-sm text-danger">Unable to load notifications.</p>
                    ) : notifications.length === 0 ? (
                      <p className="px-4 py-5 text-sm text-secondary-text">You have no notifications.</p>
                    ) : notifications.map((item) => (
                      <div key={item.notification_id} className="border-b border-border px-4 py-3 last:border-0">
                        <p className="text-sm text-text">{item.message}</p>
                        <p className="mt-1 text-xs text-secondary-text">
                          {new Date(item.created_date).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-background">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
