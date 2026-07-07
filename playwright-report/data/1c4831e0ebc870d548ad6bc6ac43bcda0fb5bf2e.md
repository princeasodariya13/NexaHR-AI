# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication Flow >> should login as admin and land on dashboard, then logout
- Location: e2e\auth.spec.ts:4:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=HR Overview').first()
Expected: visible
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('text=HR Overview').first()

```

```yaml
- complementary:
  - link "NexaHR AI":
    - /url: /
  - navigation:
    - link "Overview":
      - /url: /dashboard/admin
    - link "Employees":
      - /url: /dashboard/admin/employees
    - link "Attendance":
      - /url: /dashboard/admin/attendance
    - link "Leaves":
      - /url: /dashboard/admin/leaves
    - link "Payroll":
      - /url: /dashboard/admin/payroll
    - link "Recruitment":
      - /url: /dashboard/admin/recruitment
    - link "Documents":
      - /url: /dashboard/admin/documents
    - link "Resume AI":
      - /url: /dashboard/admin/resume-analyzer
    - link "AI Assistant":
      - /url: /dashboard/admin/ai-assistant
    - link "Audit Logs":
      - /url: /dashboard/admin/audit-logs
  - link "Settings":
    - /url: /dashboard/admin/settings
- banner:
  - textbox "Search pages and modules..."
  - button "Switch to Dark Mode"
  - button
  - text: Company Admin admin@example.com
  - link "AD":
    - /url: /dashboard/admin/settings
  - button "Logout"
- main:
  - heading "Dashboard Overview" [level=1]
  - paragraph: Welcome back! Here's what's happening today.
  - text: SUPER ADMIN View
  - paragraph: Total Employees
  - heading "16" [level=3]
  - text: ↑ 12% vs last month
  - paragraph: Present Today
  - heading "1" [level=3]
  - text: ↑ 2.4% vs last month
  - paragraph: Pending Leaves
  - heading "0" [level=3]
  - text: ↓ 5% vs last month
  - paragraph: Monthly Payroll
  - heading "₹3,70,000" [level=3]
  - text: ↑ 4.3% vs last month
  - heading "Attendance Trends" [level=3]
  - status:
    - paragraph: Sat
    - list:
      - listitem: "present : 1"
  - application: Wed Thu Fri Sat Sun Mon Tue 0 0.75 1.5 2.25 3
  - heading "AI HR Insight" [level=3]
  - paragraph:
    - text: I noticed a
    - strong: 15% increase
    - text: in sick leaves from the Engineering department this week.
  - paragraph: Also, 3 candidates in the recruitment pipeline have been pending in the "Interviewed" stage for over 7 days.
  - link "Ask AI Copilot":
    - /url: /dashboard/admin/ai-assistant
- alert
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Authentication Flow', () => {
  4  |   test('should login as admin and land on dashboard, then logout', async ({ page }) => {
  5  |     await page.goto('/login');
  6  | 
  7  |     // Fill in credentials for admin
  8  |     const testEmail = process.env.TEST_ADMIN_EMAIL || 'admin@example.com';
  9  |     const testPassword = process.env.TEST_ADMIN_PASSWORD || 'password123';
  10 |     await page.fill('input[type="email"]', testEmail);
  11 |     await page.fill('input[type="password"]', testPassword);
  12 | 
  13 |     // Click sign in
  14 |     await page.click('button[type="submit"]');
  15 | 
  16 |     // Wait for navigation to dashboard
  17 |     await page.waitForURL('/dashboard/admin');
  18 |     
  19 |     // Check if the dashboard loaded by expecting an Admin-specific text or URL
  20 |     expect(page.url()).toContain('/dashboard/admin');
> 21 |     await expect(page.locator('text=HR Overview').first()).toBeVisible({ timeout: 10000 });
     |                                                            ^ Error: expect(locator).toBeVisible() failed
  22 | 
  23 |     // Open user menu / profile picture (adjust selector if needed, usually an image or button in navbar)
  24 |     // Looking for the user avatar in TopNavbar
  25 |     await page.click('div.flex.items-center.gap-3 > div.relative > button');
  26 |     
  27 |     // Click Sign out button
  28 |     await page.click('button:has-text("Sign out")');
  29 | 
  30 |     // Wait for redirect back to login or home
  31 |     await page.waitForURL('/login');
  32 |     expect(page.url()).toContain('/login');
  33 |   });
  34 | });
  35 | 
```