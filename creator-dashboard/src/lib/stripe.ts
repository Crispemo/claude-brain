import Stripe from "stripe";

export function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

export async function getMonthlyRevenue(monthsBack = 6): Promise<Array<{ month: string; revenue: number; new_customers: number }>> {
  const stripe = getStripeClient();
  const results: Array<{ month: string; revenue: number; new_customers: number }> = [];

  for (let i = monthsBack - 1; i >= 0; i--) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

    const charges = await stripe.charges.list({
      created: {
        gte: Math.floor(start.getTime() / 1000),
        lt: Math.floor(end.getTime() / 1000),
      },
      limit: 100,
    });

    const revenue = charges.data
      .filter((c) => c.status === "succeeded")
      .reduce((sum, c) => sum + c.amount, 0) / 100;

    const customers = await stripe.customers.list({
      created: {
        gte: Math.floor(start.getTime() / 1000),
        lt: Math.floor(end.getTime() / 1000),
      },
      limit: 100,
    });

    results.push({
      month: start.toISOString().split("T")[0],
      revenue,
      new_customers: customers.data.length,
    });
  }

  return results;
}

export async function getCurrentMonthStats(): Promise<{ revenue: number; new_customers: number; total_customers: number }> {
  const stripe = getStripeClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const charges = await stripe.charges.list({
    created: { gte: Math.floor(monthStart.getTime() / 1000) },
    limit: 100,
  });

  const revenue = charges.data
    .filter((c) => c.status === "succeeded")
    .reduce((sum, c) => sum + c.amount, 0) / 100;

  const newCustomers = await stripe.customers.list({
    created: { gte: Math.floor(monthStart.getTime() / 1000) },
    limit: 100,
  });

  const allSubs = await stripe.subscriptions.list({ status: "active", limit: 100 });

  return {
    revenue,
    new_customers: newCustomers.data.length,
    total_customers: allSubs.data.length,
  };
}
