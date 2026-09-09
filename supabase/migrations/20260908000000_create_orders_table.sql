CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_wechat TEXT,
  model_name TEXT NOT NULL,
  material TEXT,
  quantity INTEGER NOT NULL,
  print_settings JSONB,
  price NUMERIC(12, 2) NOT NULL,
  estimated_print_hours NUMERIC(10, 2),
  channel TEXT NOT NULL DEFAULT 'wechat_manual',
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  paid_amount NUMERIC(12, 2),
  status TEXT NOT NULL DEFAULT 'model_check',
  status_timestamps JSONB NOT NULL DEFAULT '{}'::jsonb,
  tracking_no TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_no ON orders(order_no);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_channel ON orders(channel);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view orders by order_no"
  ON orders FOR SELECT
  TO anon, authenticated
  USING (true);
