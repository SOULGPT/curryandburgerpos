-- =======================================================
-- CURRY & BURGER MANAGER - FRESH RESET SETUP
-- =======================================================

-- 0. CLEAN RESET (Deletes old tables to prevent errors)
DROP TABLE IF EXISTS ai_conversations CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS tables CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text CHECK (role IN ('admin', 'waiter', 'kitchen', 'desk', 'display')) DEFAULT 'waiter',
  full_name text,
  avatar_url text,
  push_token text,
  created_at timestamptz DEFAULT now()
);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', COALESCE(new.raw_user_meta_data->>'role', 'waiter'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run the function on every signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


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
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, session_date)
);

-- =======================================================
-- REALTIME ENABLEMENT
-- =======================================================
-- This allows the app to listen for live changes
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE orders, order_items, tables, menu_items;

-- =======================================================
-- SEED DATA (Ready to use immediately)
-- =======================================================
INSERT INTO rooms (name, sort_order) VALUES ('Ground Floor', 1), ('Terrace', 2);

INSERT INTO tables (label, room_id, status) VALUES 
  ('1', 1, 'free'), ('2', 1, 'free'), ('3', 1, 'free'), ('4', 1, 'free'), ('5', 1, 'free'),
  ('6', 1, 'free'), ('7', 1, 'free'), ('8', 1, 'free'), ('9', 1, 'free'), ('10', 1, 'free'),
  ('T1', 2, 'free'), ('T2', 2, 'free'), ('T3', 2, 'free'), ('T4', 2, 'free'), ('T5', 2, 'free');

INSERT INTO menu_items (category, name, emoji, price, badge) VALUES 
  ('burger', 'The Ember Burger', '🔥', 12.50, 'CHEF'),
  ('burger', 'Cheese & Burger Classic', '🍔', 9.50, ''),
  ('burger', 'Truffle Magic', '🍄', 14.00, 'NEW'),
  ('curry', 'Paneer Butter Masala', '🥘', 11.00, ''),
  ('curry', 'Chicken Tikka Curry', '🍗', 13.50, 'HOT'),
  ('sides', 'Truffle Fries', '🍟', 5.50, 'HOT'),
  ('drinks', 'Mango Lassi', '🥛', 4.50, 'NEW');

-- =======================================================
-- 12. SECURITY / ACCESS (RLS) - PRODUCTION READY
-- =======================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- 12.1 PROFILES POLICIES
-- Everyone can read profiles (to see names/avatars)
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 12.2 MENU ITEMS POLICIES
-- Everyone can view available items
CREATE POLICY "Menu is viewable by everyone" ON menu_items FOR SELECT USING (available = true);
-- Only admins can manage menu
CREATE POLICY "Admins can manage menu" ON menu_items FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 12.3 ROOMS & TABLES POLICIES
-- Everyone can view rooms/tables
CREATE POLICY "Rooms/Tables viewable by everyone" ON rooms FOR SELECT USING (true);
CREATE POLICY "Rooms/Tables viewable by everyone" ON tables FOR SELECT USING (true);
-- Staff can update table status
CREATE POLICY "Staff can update tables" ON tables FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'waiter', 'desk', 'kitchen'))
);

-- 12.4 ORDERS & ORDER ITEMS POLICIES
-- Staff can view all orders
CREATE POLICY "Staff can view all orders" ON orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'waiter', 'desk', 'kitchen', 'display'))
);
CREATE POLICY "Staff can view all order items" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'waiter', 'desk', 'kitchen'))
);

-- Waiters and Admin can create orders
CREATE POLICY "Staff can create orders" ON orders FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'waiter', 'desk'))
);
CREATE POLICY "Staff can add order items" ON order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'waiter', 'desk'))
);

-- Staff can update orders (for status changes)
CREATE POLICY "Staff can update orders" ON orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'waiter', 'desk', 'kitchen'))
);

-- 12.5 AI CONVERSATIONS
CREATE POLICY "Users can manage own AI chat" ON ai_conversations FOR ALL USING (auth.uid() = user_id);

-- =======================================================
-- 13. ATOMIC ORDER CREATION (Stored Procedure)
-- =======================================================
-- This prevents "ghost orders" where the order is created but items fail
CREATE OR REPLACE FUNCTION create_order_with_items(
  p_table_id int,
  p_service_type text,
  p_waiter_id uuid,
  p_total_amount numeric,
  p_items jsonb
) RETURNS uuid AS $$
DECLARE
  v_order_id uuid;
  v_item jsonb;
BEGIN
  -- 1. Create the order
  INSERT INTO orders (table_id, service_type, waiter_id, total_amount, status)
  VALUES (p_table_id, p_service_type, p_waiter_id, p_total_amount, 'pending')
  RETURNING id INTO v_order_id;

  -- 2. Create the items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO order_items (order_id, menu_item_id, name, price, quantity)
    VALUES (
      v_order_id, 
      (v_item->>'menu_item_id')::uuid, 
      v_item->>'name', 
      (v_item->>'price')::numeric, 
      (v_item->>'quantity')::int
    );
  END LOOP;

  -- 3. Update table status if applicable
  IF p_table_id IS NOT NULL THEN
    UPDATE tables SET status = 'occupied' WHERE id = p_table_id;
  END IF;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =======================================================
-- 14. REALTIME ENABLEMENT (Refresh)
-- =======================================================
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE orders, order_items, tables, menu_items, profiles;

