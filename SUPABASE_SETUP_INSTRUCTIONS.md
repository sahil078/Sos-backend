# Supabase Setup Instructions

## How to Run the SQL Schema in Supabase

### Method 1: Using Supabase Dashboard (Recommended)

1. **Log in to Supabase**
   - Go to [https://supabase.com](https://supabase.com)
   - Log in to your account
   - Select your project (or create a new one)

2. **Open SQL Editor**
   - In the left sidebar, click on **"SQL Editor"**
   - Click **"New query"** button

3. **Copy and Paste the Schema**
   - Open the file `server/supabase-schema.sql` from this project
   - Copy the entire contents
   - Paste it into the SQL Editor

4. **Run the Query**
   - Click the **"Run"** button (or press `Ctrl+Enter` / `Cmd+Enter`)
   - Wait for the query to complete
   - You should see "Success. No rows returned" message

5. **Verify Tables Created**
   - Go to **"Table Editor"** in the left sidebar
   - You should see these tables:
     - `users`
     - `emergency_contacts`
     - `sos_alerts`
     - `notifications`
     - `sos_alert_recipients`

### Method 2: Using Supabase CLI (Advanced)

If you have Supabase CLI installed:

```bash
# Make sure you're in the server directory
cd server

# Link to your Supabase project
supabase link --project-ref your-project-ref

# Run the migration
supabase db push
```

## Step-by-Step Instructions

### Step 1: Access Supabase Dashboard
1. Go to [https://supabase.com](https://supabase.com)
2. Log in to your account
3. Select your project (or create a new project if you haven't)

### Step 2: Open SQL Editor
1. In the left sidebar, click on **"SQL Editor"**
2. Click the **"New query"** button (or use an existing query tab)

### Step 3: Copy the SQL Schema
1. Open the file `server/SUPABASE_SQL_COMMANDS.sql` from this project
2. **Copy the entire contents** (Ctrl+A, then Ctrl+C / Cmd+A, then Cmd+C)
3. **Paste** it into the Supabase SQL Editor

### Step 4: Run the Query
1. Click the **"Run"** button (or press `Ctrl+Enter` / `Cmd+Enter`)
2. Wait for the execution to complete
3. You should see: **"Success. No rows returned"** or similar success message

### Step 5: Verify Tables Created
1. Go to **"Table Editor"** in the left sidebar
2. You should see these 5 tables:
   - ✅ `users`
   - ✅ `emergency_contacts`
   - ✅ `sos_alerts`
   - ✅ `notifications`
   - ✅ `sos_alert_recipients`

## Complete SQL Schema

The SQL commands are in the file `SUPABASE_SQL_COMMANDS.sql`. Here's what it creates:

