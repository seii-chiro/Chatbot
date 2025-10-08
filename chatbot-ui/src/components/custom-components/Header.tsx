const Header = ({ children }: { children: React.ReactNode }) => {
  return <header className="w-full flex justify-end p-1">{children}</header>;
};

export default Header;
