import classNames from 'classnames';

interface Props {
  children: React.ReactNode;
  header: React.ReactNode;
  className?: string;
}
export default async function Main({ children, header, className }: Props) {
  const classes = classNames('flex-1 min-w-0 animate-fade-in', className);
  return (
    <main className={classes}>
      {typeof header === 'string' ? <h1>{header}</h1> : header}
      {children}
    </main>
  );
}
