interface Props {
  title: string;
}

export default function SectionFallback({ title }: Props) {
  return (
    <section>
      <h2>{title}</h2>
    </section>
  );
}
