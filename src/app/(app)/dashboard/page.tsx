export default function DashboardPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-2xl font-semibold">Dashboard</h2>
      <p className="max-w-md text-muted-foreground">
        Your post history will appear here. Use the Compose button to publish your
        first post.
      </p>
    </div>
  );
}
