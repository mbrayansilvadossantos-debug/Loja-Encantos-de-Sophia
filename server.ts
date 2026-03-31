import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Mercado Pago Configuration
  const client = new MercadoPagoConfig({ 
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || 'TEST-ACCESS-TOKEN' 
  });
  const payment = new Payment(client);
  const preference = new Preference(client);

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Create Preference for Checkout
  app.post("/api/create_preference", async (req, res) => {
    try {
      const { items, payer } = req.body;
      
      const body = {
        items: items.map((item: any) => ({
          title: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          currency_id: 'BRL'
        })),
        payer: {
          email: payer.email,
        },
        back_urls: {
          success: `${process.env.APP_URL}/success`,
          failure: `${process.env.APP_URL}/failure`,
          pending: `${process.env.APP_URL}/pending`,
        },
        auto_return: "approved",
      };

      const result = await preference.create({ body });
      res.json({ id: result.id });
    } catch (error) {
      console.error("Error creating preference:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Process Payment (Checkout Bricks)
  app.post("/api/process_payment", async (req, res) => {
    try {
      const { formData } = req.body;
      
      const result = await payment.create({ body: formData });
      
      res.status(201).json({
        status: result.status,
        status_detail: result.status_detail,
        id: result.id,
        point_of_interaction: result.point_of_interaction
      });
    } catch (error) {
      console.error("Error processing payment:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Webhook for Mercado Pago notifications
  app.post("/api/webhook", async (req, res) => {
    const { action, data } = req.body;
    console.log("Webhook received:", action, data);
    
    if (action === "payment.created" || action === "payment.updated") {
      try {
        const paymentId = data.id;
        const paymentData = await payment.get({ id: paymentId });
        console.log("Payment status updated:", paymentData.status);
        // Here you would update your database status
      } catch (error) {
        console.error("Error fetching payment data from webhook:", error);
      }
    }
    
    res.sendStatus(200);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    // Explicitly serve index.html for the root route in dev mode
    app.get('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = await fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
