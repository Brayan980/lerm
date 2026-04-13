import type { FC } from 'react';

interface AppLogoProps {
  className?: string;
}

const AppLogo: FC<AppLogoProps> = ({ className }) => {
  return (
    <h1 className={`text-2xl font-bold text-primary ${className}`}>
      LERM
    </h1>
  );
};

export default AppLogo;
