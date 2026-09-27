import React, { useState, useEffect } from 'react';
import { I18nProvider, useI18n } from './lib/i18n';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { Navbar } from './components/common/Navbar';
import { AuthModal } from './components/auth/AuthModal';
import { HeroSection } from './components/home/HeroSection';
import { ServicesSection } from './components/home/ServicesSection';
import { HowItWorksSection } from './components/home/HowItWorksSection';
import { WhyTechHelpSection } from './components/home/WhyTechHelpSection';
import { VerifiedTechniciansSection } from './components/home/VerifiedTechniciansSection';
import { ReviewsSection } from './components/home/ReviewsSection';
import { Footer } from './components/home/Footer';
import { CustomerDashboard } from './components/customer/CustomerDashboard';
import { CreateRequestModal } from './components/customer/CreateRequestModal';
import { TechnicianDashboard } from './components/technician/TechnicianDashboard';
import { CompanyDashboard } from './components/company/CompanyDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { SuspendedAccountScreen } from './components/common/SuspendedAccountScreen';
import { BottomNavigation } from './components/common/BottomNavigation';
import { Service } from './types/database';

function MainApp() {
  const { user, profile } = useAuth();
  const { lang } = useI18n();
  const { showInfo } = useToast();
  const [currentView, setCurrentView] = useState<'home' | 'customer' | 'technician' | 'company' | 'admin'>('home');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [createRequestOpen, setCreateRequestOpen] = useState(false);
  const [preselectedService, setPreselectedService] = useState<Service | null>(null);

  // Sync with URL hash for bookmarking and testing (e.g. #customer, #technician, #admin, #company)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (['customer', 'technician', 'company', 'admin', 'home'].includes(hash)) {
        setCurrentView(hash as any);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Update hash when currentView changes
  const handleNavigate = (view: string) => {
    setCurrentView(view as any);
    window.location.hash = view === 'home' ? '' : view;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auto redirect user to role dashboard on login if currently at home
  useEffect(() => {
    if (user && profile && currentView === 'home' && !window.location.hash) {
      if (profile.role === 'technician') setCurrentView('technician');
      else if (profile.role === 'company') setCurrentView('company');
      else if (profile.role === 'admin') setCurrentView('admin');
      else if (profile.role === 'customer') setCurrentView('customer');
    }
  }, [user, profile]);

  const handleSelectServiceFromHome = (service: Service) => {
    setPreselectedService(service);
    if (!user) {
      setAuthModalMode('login');
      setAuthModalOpen(true);
      showInfo(
        lang === 'ar'
          ? 'يرجى تسجيل الدخول أو إنشاء حساب لطلب هذه الخدمة'
          : 'Please log in or create an account to request this service'
      );
    } else {
      setCreateRequestOpen(true);
    }
  };

  const handleHeroRequestClick = () => {
    if (!user) {
      setAuthModalMode('register');
      setAuthModalOpen(true);
    } else {
      setPreselectedService(null);
      setCreateRequestOpen(true);
    }
  };

  // If user is suspended/inactive, show the Suspended Account Screen with the recorded reason
  if (user && profile && profile.is_active === false && profile.role !== 'admin') {
    return <SuspendedAccountScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 pb-16 md:pb-0">
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenAuth={mode => {
          setAuthModalMode(mode);
          setAuthModalOpen(true);
        }}
      />

      <main className="flex-1">
        {currentView === 'home' && (
          <>
            <HeroSection
              onRequestClick={handleHeroRequestClick}
              onLoginClick={() => {
                setAuthModalMode('login');
                setAuthModalOpen(true);
              }}
            />
            <ServicesSection onSelectService={handleSelectServiceFromHome} />
            <HowItWorksSection />
            <WhyTechHelpSection />
            <VerifiedTechniciansSection />
            <ReviewsSection />
          </>
        )}

        {currentView === 'customer' && <CustomerDashboard />}
        {currentView === 'technician' && <TechnicianDashboard />}
        {currentView === 'company' && <CompanyDashboard />}
        {currentView === 'admin' && <AdminDashboard />}
      </main>

      <Footer />

      {/* Mobile Bottom Navigation matching TechHelp app design */}
      <BottomNavigation
        currentView={currentView}
        onNavigate={handleNavigate}
        onRequestService={handleHeroRequestClick}
        onOpenAuth={mode => {
          setAuthModalMode(mode);
          setAuthModalOpen(true);
        }}
      />

      {/* Global Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        onSuccess={() => {
          if (preselectedService) {
            setCreateRequestOpen(true);
          }
        }}
      />

      <CreateRequestModal
        isOpen={createRequestOpen}
        onClose={() => setCreateRequestOpen(false)}
        preselectedService={preselectedService}
        onRequestCreated={() => {
          if (currentView !== 'customer') {
            handleNavigate('customer');
          }
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <ToastProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </ToastProvider>
    </I18nProvider>
  );
}
