import Link from 'next/link';
import Image from 'next/image';

interface MenuCardProps {
  iconSrc: string;
  iconAlt: string;
  title: string;
  description: string;
  href: string;
}

export default function MenuCard({ iconSrc, iconAlt, title, description, href }: MenuCardProps) {
  return (
    <div className="col-12 col-md-6">
      <div className="card shadow-sm home-menu-card">
        <div className="card-body d-flex flex-column">
          <h5 className="card-title d-flex align-items-center">
            <Image src={iconSrc} alt={iconAlt} width={24} height={24} className="me-2" />
            {title}
          </h5>
          <p className="card-text">{description}</p>
          <Link className="btn btn-primary mt-auto ms-auto" href={href}>開く</Link>
        </div>
      </div>
    </div>
  );
}







