import { ReactNode } from 'react';
import HelpButton from '../HelpButton';

interface PageHeaderProps {
  title: string | ReactNode;
}

export default function PageHeader({ title }: PageHeaderProps) {
  return (
    <div className="d-flex justify-content-between align-items-center mb-4">
      <h1 className="page-title mb-0">{title}</h1>
      <HelpButton />
    </div>
  );
}
