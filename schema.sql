-- =======================================================
-- CURRY & BURGER MANAGER - SUPABASE SCHEMA
-- Paste this entirely into the Supabase SQL Editor
-- =======================================================

-- 1. Create Profiles Table (extends auth.users)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text CHECK (role IN ('admin', 'waiter', 'kitchen', 'desk', 'display')),
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- 2. Create Rooms Table
CREATE TABLE rooms (
  id int PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text NOT NULL,
  description text,
  sort_order int DEFAULT 0,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- 3. Create Tables Table
CREATE TABLE tables (
  id int PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  label text NOT NULL,
  room_id int REFERENCES rooms(id) ON DELETE SET NULL,
  capacity int DEFAULT 4,
  status text DEFAULT 'free' CHECK (status IN ('free', 'occupied', 'ready', 'bill_requested')),
  notes text,
  created_by uuid REFERENCES profiles(id),
  deleted_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- 4. Create Menu Items Table
CREATE TABLE menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text CHECK (category IN ('burger', 'curry', 'wraps', 'sides', 'drinks', 'desserts')),
  name text NOT NULL,
  emoji text,
  price numeric(6,2) NOT NULL,
  badge text CHECK (badge IN ('NEW', 'CHEF', 'HOT', 'None', '') OR badge IS NULL),
  available boolean DEFAULT true,
  sort_order int DEFAULT 0,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- 5. Create Orders Table
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number int GENERATED ALWAYS AS IDENTITY,
  table_id int REFERENCES tables(id) ON DELETE SET NULL,
  service_type text CHECK (service_type IN ('tavolo', 'asporto')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'served')),
  waiter_id uuid REFERENCES profiles(id),
  total_amount numeric(8,2),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. Create Order Items Table
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE SET NULL,
  name text NOT NULL,
  price numeric(6,2) NOT NULL,
  quantity int NOT NULL DEFAULT 1,
  subtotal numeric(8,2) GENERATED ALWAYS AS (price * quantity) STORED
);

-- 7. Create AI Conversations Table
CREATE TABLE ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  messages jsonb,
  session_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- =======================================================
-- REALTIME ENABLEMENT
-- =======================================================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE tables;
ALTER PUBLICATION supabase_realtime ADD TABLE menu_items;

-- =======================================================
-- SEED DATA (Default Rooms and Tables)
-- =======================================================
INSERT INTO rooms (name, sort_order) VALUES ('Ground Floor', 1), ('Terrace', 2);

-- Insert 10 tables for Room 1
INSERT INTO tables (label, room_id, status) VALUES 
  ('1', 1, 'free'), ('2', 1, 'free'), ('3', 1, 'free'), ('4', 1, 'free'), ('5', 1, 'free'),
  ('6', 1, 'free'), ('7', 1, 'free'), ('8', 1, 'free'), ('9', 1, 'free'), ('10', 1, 'free');

-- Insert 5 tables for Room 2 (Terrace)
INSERT INTO tables (label, room_id, status) VALUES 
  ('T1', 2, 'free'), ('T2', 2, 'free'), ('T3', 2, 'free'), ('T4', 2, 'free'), ('T5', 2, 'free');

-- =======================================================
-- SECURITY / ROW LEVEL SECURITY (RLS)
-- =======================================================
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- Disable RLS for now during development phase to prevent connection blockers
-- (You can re-enable and restrict later when deploying to production)
CREATE POLICY "Allow all operations for profiles" ON profiles FOR ALL USING (true);
CREATE POLICY "Allow all operations for rooms" ON rooms FOR ALL USING (true);
CREATE POLICY "Allow all operations for tables" ON tables FOR ALL USING (true);
CREATE POLICY "Allow all operations for menu_items" ON menu_items FOR ALL USING (true);
CREATE POLICY "Allow all operations for orders" ON orders FOR ALL USING (true);
CREATE POLICY "Allow all operations for order_items" ON order_items FOR ALL USING (true);
CREATE POLICY "Allow all operations for ai_conversations" ON ai_conversations FOR ALL USING (true);
