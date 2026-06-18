import { useEffect } from "react";
import { render, waitFor, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

function ContextProbe({ onReady }: { onReady: (ctx: ReturnType<typeof useAuth>) => void }) {
  const ctx = useAuth();

  useEffect(() => {
    if (ctx.isReady) {
      onReady(ctx);
    }
  }, [ctx, onReady]);

  return null;
}

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("prevents duplicate usernames on registration", async () => {
    let ctx: ReturnType<typeof useAuth> | null = null;

    render(
      <AuthProvider>
        <ContextProbe onReady={(value) => (ctx = value)} />
      </AuthProvider>,
    );

    await waitFor(() => expect(ctx?.isReady).toBe(true));

    let result: { success: boolean; error?: string } | null = null;
    await act(async () => {
      result = await ctx!.register("alex@example.com", "password", "alex", "Duplicate User");
    });

    expect(result?.success).toBe(false);
    expect(result?.error).toBe("Email or username already exists");
  });

  it("rejects login with wrong password", async () => {
    let ctx: ReturnType<typeof useAuth> | null = null;

    render(
      <AuthProvider>
        <ContextProbe onReady={(value) => (ctx = value)} />
      </AuthProvider>,
    );

    await waitFor(() => expect(ctx?.isReady).toBe(true));

    let result: { success: boolean; error?: string } | null = null;
    await act(async () => {
      result = await ctx!.login("alex@example.com", "wrong-password");
    });

    expect(result?.success).toBe(false);
    expect(result?.error).toBe("Invalid credentials");
  });
});