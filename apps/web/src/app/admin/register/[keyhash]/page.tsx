interface Props {
  params: {
    keyhash: string;
  };
}
export default async function AdminRegisterPage({ params }: Props) {
  return (
    <main className="main">
      <h1>Register player keyhash</h1>
      <p>{`Keyhash: ${params.keyhash}`}</p>
    </main>
  );
}
