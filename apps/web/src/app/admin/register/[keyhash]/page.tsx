interface Props {
  params: Promise<{
    keyhash: string;
  }>;
}
export default async function AdminRegisterPage(props: Props) {
  const params = await props.params;
  return (
    <main className="main">
      <h1>Register player keyhash</h1>
      <p>{`Keyhash: ${params.keyhash}`}</p>
    </main>
  );
}
