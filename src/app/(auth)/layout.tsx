export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main id="main" className="auth-page">
      <div className="auth-card">
        <a href="/login" className="brand">
          familyOS
        </a>
        {children}
      </div>
    </main>
  );
}
