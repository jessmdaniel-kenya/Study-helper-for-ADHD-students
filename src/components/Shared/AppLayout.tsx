import type { ReactNode } from 'react';
import NavBar from './NavBar';
import { useAppStore } from '../../stores/useAppStore';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const accessibilityProfile = useAppStore(
    (state) => state.accessibilityProfile,
  );
  const className = [
    'app-layout',
    accessibilityProfile.dyslexiaFont && 'app-layout--dyslexia',
    (accessibilityProfile.reducedMotion || accessibilityProfile.lowSensory) &&
      'app-layout--still',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className}>
      <NavBar />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
