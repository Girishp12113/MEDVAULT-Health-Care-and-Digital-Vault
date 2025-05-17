import { Link, useLocation } from 'react-router-dom';
import { FileText, Calendar, Pill as Pills, Activity, User, LogOut, Brain, Users, ClipboardList, Heart } from 'lucide-react';
import NotificationCenter from './NotificationCenter';

interface NavbarProps {
  userRole: 'patient' | 'doctor';
  onLogout: () => Promise<void>;
}

const Navbar = ({ userRole, onLogout }: NavbarProps) => {
  const location = useLocation();

  const patientNavItems = [
    {
      path: '/',
      icon: Activity,
      label: 'Dashboard',
      description: 'View your health overview and recent activities'
    },
    {
      path: '/reports',
      icon: FileText,
      label: 'Reports',
      description: 'Access and manage your medical reports'
    },
    {
      path: '/medications',
      icon: Pills,
      label: 'Medications',
      description: 'Track and manage your medications'
    },
    {
      path: '/appointments',
      icon: Calendar,
      label: 'Appointments',
      description: 'Schedule and manage your doctor appointments'
    },
    {
      path: '/ai-analysis',
      icon: Brain,
      label: 'AI Analysis',
      description: 'Get AI-powered analysis of your medical reports'
    },
    {
      path: '/health-metrics',
      icon: Heart,
      label: 'Health Metrics',
      description: 'Track your vital signs and health metrics'
    },
    {
      path: '/profile',
      icon: User,
      label: 'Profile',
      description: 'View and update your profile information'
    },
  ];

  const doctorNavItems = [
    {
      path: '/doctor/dashboard',
      icon: Users,
      label: 'Patients',
      description: 'View and manage your patients'
    },
    {
      path: '/doctor/appointments',
      icon: Calendar,
      label: 'Appointments',
      description: 'Manage patient appointments'
    },
    {
      path: '/doctor/profile',
      icon: User,
      label: 'Profile',
      description: 'View and update your profile'
    },
    {
      path: '/doctor/reports',
      icon: ClipboardList,
      label: 'Reports',
      description: 'View patient reports and analyses'
    }
  ];

  const navItems = userRole === 'doctor' ? doctorNavItems : patientNavItems;

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-indigo-600">
                {userRole === 'doctor' ? 'Doctor Portal' : 'Patient Portal'}
              </span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {userRole === 'patient' && <NotificationCenter onClose={() => {}} />}
            <button
              onClick={onLogout}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="sm:hidden">
        <div className="pt-2 pb-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`${
                  isActive
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
              >
                <div className="flex items-center">
                  <Icon className="w-4 h-4 mr-2" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;