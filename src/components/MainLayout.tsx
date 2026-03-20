import React from 'react';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="patient-portal-container">
      {children}
    </div>
  );
};

export default MainLayout;
import '../styles/global.css';
