import { createFileRoute } from '@tanstack/react-router';
import WelcomeGuide from '../components/WelcomeGuide';

export const Route = createFileRoute('/welcome')({
  component: WelcomeGuide,
});
