-- Create currency enum
CREATE TYPE public.currency_type AS ENUM ('INR', 'USD', 'EUR', 'GBP', 'AED', 'CAD', 'AUD', 'JPY', 'CNY');

-- Create group invite status enum
CREATE TYPE public.group_invite_status AS ENUM ('pending', 'accepted', 'rejected');

-- Create expense categories table
CREATE TABLE public.expense_categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '💰',
    is_system BOOLEAN DEFAULT false,
    parent_id UUID REFERENCES public.expense_categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on expense_categories
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

-- Policies for expense_categories (users see their own + system categories)
CREATE POLICY "Users can view their own and system categories"
ON public.expense_categories FOR SELECT
USING (user_id = auth.uid() OR is_system = true);

CREATE POLICY "Users can create their own categories"
ON public.expense_categories FOR INSERT
WITH CHECK (user_id = auth.uid() AND is_system = false);

CREATE POLICY "Users can update their own categories"
ON public.expense_categories FOR UPDATE
USING (user_id = auth.uid() AND is_system = false);

CREATE POLICY "Users can delete their own categories"
ON public.expense_categories FOR DELETE
USING (user_id = auth.uid() AND is_system = false);

-- Create expense groups table
CREATE TABLE public.expense_groups (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    group_type TEXT NOT NULL DEFAULT 'family' CHECK (group_type IN ('family', 'roommates', 'class', 'friends', 'work')),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invite_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
    currency currency_type NOT NULL DEFAULT 'INR',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on expense_groups
ALTER TABLE public.expense_groups ENABLE ROW LEVEL SECURITY;

-- Create group members table
CREATE TABLE public.expense_group_members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES public.expense_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    status group_invite_status NOT NULL DEFAULT 'pending',
    joined_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(group_id, user_id)
);

-- Enable RLS on expense_group_members
ALTER TABLE public.expense_group_members ENABLE ROW LEVEL SECURITY;

-- Create user settings for currency preference
CREATE TABLE public.user_expense_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    preferred_currency currency_type NOT NULL DEFAULT 'INR',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_expense_settings
ALTER TABLE public.user_expense_settings ENABLE ROW LEVEL SECURITY;

-- Policies for user_expense_settings
CREATE POLICY "Users can view their own settings"
ON public.user_expense_settings FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own settings"
ON public.user_expense_settings FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own settings"
ON public.user_expense_settings FOR UPDATE
USING (user_id = auth.uid());

-- Create expenses table
CREATE TABLE public.expenses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    group_id UUID REFERENCES public.expense_groups(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.expense_categories(id) ON DELETE SET NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
    currency currency_type NOT NULL DEFAULT 'INR',
    note TEXT,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expense_time TIME NOT NULL DEFAULT CURRENT_TIME,
    is_group_expense BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Security definer function to check group membership
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id UUID, _group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.expense_group_members
        WHERE user_id = _user_id
        AND group_id = _group_id
        AND status = 'accepted'
    )
$$;

-- Security definer function to check if user is group admin
CREATE OR REPLACE FUNCTION public.is_group_admin(_user_id UUID, _group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.expense_group_members
        WHERE user_id = _user_id
        AND group_id = _group_id
        AND role = 'admin'
        AND status = 'accepted'
    )
$$;

-- Policies for expense_groups (only see groups you're a member of)
CREATE POLICY "Users can view groups they are members of"
ON public.expense_groups FOR SELECT
USING (
    created_by = auth.uid() OR
    public.is_group_member(auth.uid(), id)
);

CREATE POLICY "Users can create groups"
ON public.expense_groups FOR INSERT
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Only admins can update groups"
ON public.expense_groups FOR UPDATE
USING (public.is_group_admin(auth.uid(), id));

CREATE POLICY "Only creators can delete groups"
ON public.expense_groups FOR DELETE
USING (created_by = auth.uid());

-- Policies for expense_group_members
CREATE POLICY "Users can view members of their groups"
ON public.expense_group_members FOR SELECT
USING (
    user_id = auth.uid() OR
    public.is_group_member(auth.uid(), group_id)
);

CREATE POLICY "Admins can add members"
ON public.expense_group_members FOR INSERT
WITH CHECK (
    user_id = auth.uid() OR
    public.is_group_admin(auth.uid(), group_id)
);

CREATE POLICY "Admins can update member status"
ON public.expense_group_members FOR UPDATE
USING (
    user_id = auth.uid() OR
    public.is_group_admin(auth.uid(), group_id)
);

CREATE POLICY "Admins can remove members"
ON public.expense_group_members FOR DELETE
USING (
    user_id = auth.uid() OR
    public.is_group_admin(auth.uid(), group_id)
);

-- Policies for expenses
CREATE POLICY "Users can view their own expenses"
ON public.expenses FOR SELECT
USING (
    user_id = auth.uid() OR
    (group_id IS NOT NULL AND public.is_group_member(auth.uid(), group_id))
);

CREATE POLICY "Users can create their own expenses"
ON public.expenses FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own expenses"
ON public.expenses FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own expenses"
ON public.expenses FOR DELETE
USING (user_id = auth.uid());

-- Insert system expense categories (null user_id = system category)
INSERT INTO public.expense_categories (user_id, name, icon, is_system, parent_id) VALUES
(NULL, 'Food', '🍔', true, NULL),
(NULL, 'Travel', '🚗', true, NULL),
(NULL, 'Housing', '🏠', true, NULL),
(NULL, 'Fuel', '⛽', true, NULL),
(NULL, 'Recharge & Internet', '📱', true, NULL),
(NULL, 'Subscriptions', '📺', true, NULL),
(NULL, 'Other', '📦', true, NULL);

-- Insert subcategories
INSERT INTO public.expense_categories (user_id, name, icon, is_system, parent_id)
SELECT NULL, sub.name, sub.icon, true, parent.id
FROM (VALUES 
    ('Food', 'Groceries', '🛒'),
    ('Food', 'Vegetables', '🥬'),
    ('Food', 'Milk', '🥛'),
    ('Food', 'Snacks', '🍪'),
    ('Food', 'Outside Food', '🍕'),
    ('Travel', 'Auto', '🛺'),
    ('Travel', 'Bus', '🚌'),
    ('Travel', 'Train', '🚆'),
    ('Travel', 'Metro', '🚇'),
    ('Travel', 'Rapido/Bike Taxi', '🏍️'),
    ('Travel', 'Cab', '🚕'),
    ('Housing', 'Rent', '🏢'),
    ('Housing', 'Electricity', '💡'),
    ('Housing', 'Gas', '🔥'),
    ('Housing', 'Water', '💧'),
    ('Fuel', 'Petrol', '⛽'),
    ('Fuel', 'Diesel', '⛽'),
    ('Recharge & Internet', 'Mobile Recharge', '📲'),
    ('Recharge & Internet', 'Fiber Recharge', '🌐'),
    ('Subscriptions', 'OTT', '🎬'),
    ('Subscriptions', 'Music', '🎵'),
    ('Subscriptions', 'Software', '💻')
) AS sub(parent_name, name, icon)
JOIN public.expense_categories parent ON parent.name = sub.parent_name AND parent.is_system = true AND parent.parent_id IS NULL;

-- Create trigger to auto-add creator as admin member
CREATE OR REPLACE FUNCTION public.add_creator_as_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.expense_group_members (group_id, user_id, role, status, joined_at)
    VALUES (NEW.id, NEW.created_by, 'admin', 'accepted', now());
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_group_created
AFTER INSERT ON public.expense_groups
FOR EACH ROW
EXECUTE FUNCTION public.add_creator_as_admin();

-- Create trigger to update updated_at
CREATE TRIGGER update_expenses_updated_at
BEFORE UPDATE ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expense_groups_updated_at
BEFORE UPDATE ON public.expense_groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_expense_settings_updated_at
BEFORE UPDATE ON public.user_expense_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();