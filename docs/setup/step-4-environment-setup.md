# Step 4: Environment Setup

## Create Environment File

In the root of your project directory, create a file named `.env`:

### Option 1: Using Terminal

```bash
touch .env
```

Then open it in your editor.

### Option 2: Using Your Code Editor

Create a new file named `.env` in the project root.

## Add Environment Variables

Add the following content to your `.env` file:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace the values with your actual Supabase credentials from Step 3.

## Example

```env
VITE_SUPABASE_URL=https://abcdefghijk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MjM0NTY3ODksImV4cCI6MTkzOTAzMjc4OX0.abcdefghijklmnopqrstuvwxyz123456
```

## Important Notes

- The `.env` file should NOT be committed to git (it's in .gitignore)
- Keep your keys secret - never share them publicly
- The `VITE_` prefix is required for Vite to expose these variables

## Verify File Location

Your project structure should look like:

```
secureapps/
├── .env          <-- Your new file
├── package.json
├── src/
└── ...
```

## Checklist

- [ ] .env file created in project root
- [ ] VITE_SUPABASE_URL added with your project URL
- [ ] VITE_SUPABASE_ANON_KEY added with your anon key

## Next Step

Proceed to [Step 5: Database Setup](step-5-database-setup.md)
