import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hello World" },
      { name: "description", content: "A simple hello world app." },
      { property: "og:title", content: "Hello World" },
      { property: "og:description", content: "A simple hello world app." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-6xl font-bold tracking-tight text-foreground">
          Hello, world!
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Welcome to your new app.
        </p>
      </div>
    </div>
  );
}
