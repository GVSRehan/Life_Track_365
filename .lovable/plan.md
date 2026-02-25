
Goal: resolve the “Unable to Login” issue reliably for both existing and newly registered users, and make the auth flow resilient for demos.

What I found from debugging:
- The app is reaching Supabase correctly.
- Login attempts are hitting `POST /auth/v1/token?grant_type=password` and returning `400 invalid_credentials` (not a network outage).
- Signup request is working (`POST /auth/v1/otp` returns `200`), so project/auth connectivity is fine.
- There is a likely OTP verification mismatch in code:
  - `signUp()` uses `signInWithOtp(...)` (email OTP flow).
  - `verifyOtp()` currently uses `type: 'signup'`.
  - For email OTP via `signInWithOtp`, Supabase expects `type: 'email'` for code verification.
  - This can cause users to fail verification, never set a usable password, then fail login later.

Implementation plan:

1) Fix OTP verification type and harden verification fallback
- File: `src/hooks/useAuth.tsx`
- Changes:
  - Update OTP verify call to use `type: 'email'` as primary.
  - Add safe fallback handling (optional but recommended) for `type: 'signup'` only when needed, so older links/flows don’t regress.
  - Preserve current behavior of setting password immediately after successful OTP verification.
- Why first:
  - This fixes root account-creation correctness, preventing future login failures from incomplete signup.

2) Improve login failure handling for real users (especially demo situations)
- File: `src/pages/Auth.tsx`
- Changes:
  - Detect invalid credential errors and show a clearer, actionable message (not just generic toast).
  - Add direct CTA from failed sign-in to forgot-password view, prefilled with entered email.
  - Keep existing toast, but add persistent inline error state so users don’t miss transient notifications.
- Outcome:
  - Users immediately know next step and can recover access without confusion.

3) Improve credential UX compatibility on mobile/browser autofill
- File: `src/pages/Auth.tsx`
- Changes:
  - Add proper `autoComplete` attributes:
    - email fields: `autoComplete="email"`
    - sign-in password: `autoComplete="current-password"`
    - sign-up/reset password: `autoComplete="new-password"`
  - Keep eye icon behavior as-is.
- Why:
  - Reduces input mistakes and improves login success on mobile/password managers.

4) Ensure loading/error state reliability
- File: `src/pages/Auth.tsx`
- Changes:
  - Use `try/catch/finally` patterns for sign-in/sign-up/verify/reset handlers so loading states always reset, even on thrown exceptions.
  - Clear stale error state when users switch views or edit inputs.
- Why:
  - Prevents “stuck” buttons and inconsistent UI during auth retries.

5) End-to-end validation before handoff
- Functional tests to run:
  1. Existing user wrong password → clear error + one-tap reset path.
  2. Forgot password email request succeeds.
  3. New signup: OTP sent → OTP verified → password set.
  4. Login with newly set password routes to `/`.
  5. Mobile view checks for visibility and form behavior.
- Verification sources:
  - Browser network requests (`/token`, `/otp`, `/verify`) and auth logs in Supabase for status correctness.

Technical notes:
- No database migration is required for this fix.
- No RLS policy changes are needed for auth login/signup itself.
- Existing security warnings in scan are unrelated to this login failure path (they can be handled in a separate pass).

Potential edge cases covered:
- User has old account but forgot password → immediate recovery path.
- User started signup but OTP verify failed previously → corrected verify type enables completion.
- Transient auth errors → clearer messaging and retry-ready UI.
