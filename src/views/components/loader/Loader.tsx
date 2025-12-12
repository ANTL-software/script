import './loader.scss';

export interface LoaderProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'white' | 'gray';
  className?: string;
}

export default function Loader({
  size = 'medium',
  color = 'primary',
  className = ''
}: LoaderProps) {
  return (
    <div className={`loader loader-${size} loader-${color} ${className}`}>
      <div className="loader-spinner"></div>
    </div>
  );
}
