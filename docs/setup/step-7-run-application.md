# Step 7: Run the Application

## Start Development Server

In your project directory, run:

```bash
npm run dev
```

You should see output like:

```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

## Access the Application

Open your web browser and go to:

```
http://localhost:5173
```

## Login

1. You should see the login page
2. Enter your admin credentials:
   - Email: `admin@example.com`
   - Password: (the password you created)
3. Click **Login**

## Verify Everything Works

After logging in, verify:

- [ ] Dashboard loads correctly
- [ ] You can see the admin menu (if logged in as admin)
- [ ] No errors in the browser console (F12 > Console)

## Common Issues

### "Invalid login credentials"
- Double-check your email and password
- Make sure the user was created in Supabase

### "Failed to fetch" or network errors
- Check your `.env` file has correct values
- Make sure Supabase project is running

### Blank page
- Check browser console for errors
- Verify all npm packages installed correctly

## Stop the Server

To stop the development server, press `Ctrl + C` in the terminal.

## Checklist

- [ ] npm run dev starts without errors
- [ ] Application loads at http://localhost:5173
- [ ] Can login with admin account
- [ ] Dashboard displays correctly

## Setup Complete!

Congratulations! Your SecureApps installation is complete.

## Next Steps

- Add applications to your dashboard
- Create regular user accounts
- Explore the admin features
- Read the main [README](../../README.md) for more features
