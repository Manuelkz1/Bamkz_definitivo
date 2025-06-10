-- Add phone field to users table for phone authentication
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_method text DEFAULT 'email';

-- Create index for phone lookup
CREATE INDEX IF NOT EXISTS users_phone_idx ON users(phone);

-- Add unique constraint for phone (allowing nulls)
CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique_idx ON users(phone) WHERE phone IS NOT NULL;

-- Update RLS policies to allow phone authentication
CREATE POLICY "Allow phone authentication signup" 
  ON users 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- Update existing policy to allow viewing users by phone
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
CREATE POLICY "Users can view their own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR phone IS NOT NULL);

-- Function to handle phone user creation
CREATE OR REPLACE FUNCTION handle_phone_user_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is a phone auth user, ensure they can be found
  IF NEW.auth_method = 'phone' AND NEW.phone IS NOT NULL THEN
    -- Update any existing user with same phone
    UPDATE users 
    SET 
      id = NEW.id,
      email = NEW.email,
      full_name = NEW.full_name,
      auth_method = NEW.auth_method,
      updated_at = now()
    WHERE phone = NEW.phone AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for phone user handling
DROP TRIGGER IF EXISTS on_phone_user_creation ON users;
CREATE TRIGGER on_phone_user_creation
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION handle_phone_user_creation();
