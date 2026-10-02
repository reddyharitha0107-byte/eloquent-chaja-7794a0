// The gateway deliberately moves no money. Its stable reference makes retries idempotent.
export const mockPaymentGateway = {
  async initiateRefund(orderId: string, amount: number) {
    const started = Date.now();
    await new Promise(resolve => setTimeout(resolve, 400));
    return { reference: `SIM-${orderId}`, amount, durationMs: Date.now() - started, status: "completed" as const };
  },
};
