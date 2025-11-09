import { createFileRoute } from '@tanstack/react-router';
import DBTest from '../components/DBTest';

export const Route = createFileRoute('/db-test')({
  component: () => <DBTest />,
});

