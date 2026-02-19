import { ReactNode } from 'react';

interface HelpSectionProps {
  id: string;
  title: string;
  children: ReactNode;
  className?: string;
}

export default function HelpSection({ id, title, children, className = '' }: HelpSectionProps) {
  return (
    <section id={id} className={`mb-5 ${className}`}>
      <div className="card">
        <div className="card-body">
          <h2 className="h4 mb-3 fw-bold">{title}</h2>
          {children}
        </div>
      </div>
    </section>
  );
}







