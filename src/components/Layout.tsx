import type { FC, ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

const Layout: FC<LayoutProps> = ({ children }) => {
  return <div style={{ padding: '20px' }}>{children}</div>;
};

export default Layout;