-- Create tasks table for storing user tasks with proper time validation
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_time TEXT NOT NULL, -- HH:MM format
  end_time TEXT NOT NULL, -- HH:MM format
  date TEXT NOT NULL, -- YYYY-MM-DD format
  category TEXT NOT NULL DEFAULT 'work',
  acknowledged TEXT, -- ISO timestamp when acknowledged
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own tasks" 
ON public.tasks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks" 
ON public.tasks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" 
ON public.tasks 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" 
ON public.tasks 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get server time (for accurate time validation)
CREATE OR REPLACE FUNCTION public.get_server_time()
RETURNS JSONB AS $$
DECLARE
  current_ts TIMESTAMP WITH TIME ZONE;
BEGIN
  current_ts := now();
  RETURN jsonb_build_object(
    'timestamp', current_ts,
    'date', to_char(current_ts, 'YYYY-MM-DD'),
    'time', to_char(current_ts, 'HH24:MI:SS'),
    'hour', EXTRACT(HOUR FROM current_ts),
    'minute', EXTRACT(MINUTE FROM current_ts),
    'second', EXTRACT(SECOND FROM current_ts),
    'timezone', current_setting('TIMEZONE')
  );
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create function to validate task time (ensure user can only add tasks in the future)
CREATE OR REPLACE FUNCTION public.validate_task_time()
RETURNS TRIGGER AS $$
DECLARE
  task_date DATE;
  task_start_time TIME;
  current_ts TIMESTAMP WITH TIME ZONE;
  task_datetime TIMESTAMP WITH TIME ZONE;
BEGIN
  current_ts := now();
  task_date := NEW.date::DATE;
  task_start_time := NEW.start_time::TIME;
  
  -- Combine date and time
  task_datetime := task_date + task_start_time;
  
  -- Check if task is in the past
  IF task_datetime < current_ts THEN
    RAISE EXCEPTION 'Cannot add tasks in the past. Task time: %, Current time: %', task_datetime, current_ts;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to validate task time on insert
CREATE TRIGGER validate_task_time_trigger
BEFORE INSERT ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.validate_task_time();

-- Create index for faster queries
CREATE INDEX idx_tasks_user_date ON public.tasks(user_id, date);
CREATE INDEX idx_tasks_date ON public.tasks(date);