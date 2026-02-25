
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Calendar, ArrowLeft, Mail, AlertCircle } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

type AuthView = 'main' | 'otp' | 'forgot-password' | 'reset-password';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [authView, setAuthView] = useState<AuthView>('main');
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingPassword, setPendingPassword] = useState('');
  const [pendingFullName, setPendingFullName] = useState('');
  const [inlineError, setInlineError] = useState('');
  const { signIn, signUp, verifyOtp, resetPassword, updatePassword, user, session } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check if user came from password reset link
  useEffect(() => {
    const isReset = searchParams.get('reset') === 'true';
    if (isReset && session) {
      setAuthView('reset-password');
    }
  }, [searchParams, session]);

  useEffect(() => {
    if (user && authView !== 'reset-password') {
      navigate('/');
    }
  }, [user, navigate, authView]);

  // Clear inline error when user edits inputs
  useEffect(() => {
    setInlineError('');
  }, [email, password, fullName]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setInlineError('');

    try {
      const { error } = await signIn(email, password);

      if (error) {
        const isInvalidCreds = error.message?.toLowerCase().includes('invalid') ||
          error.message?.toLowerCase().includes('credentials');
        
        if (isInvalidCreds) {
          setInlineError('Invalid email or password. Try resetting your password if you forgot it.');
        } else {
          toast({
            title: 'Error signing in',
            description: error.message,
            variant: 'destructive',
          });
        }
      } else {
        toast({ title: 'Success', description: 'Signed in successfully!' });
      }
    } catch {
      toast({ title: 'Error', description: 'Network error. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !fullName.trim()) {
      toast({ title: 'Missing fields', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    setLoading(true);
    setInlineError('');

    try {
      const { error } = await signUp(email, password, fullName);

      if (error) {
        toast({ title: 'Error signing up', description: error.message, variant: 'destructive' });
      } else {
        setPendingEmail(email);
        setPendingPassword(password);
        setPendingFullName(fullName);
        setOtp('');
        setAuthView('otp');
        toast({ title: 'OTP sent', description: 'Check your email for the 6-digit verification code.' });
      }
    } catch {
      toast({ title: 'Error', description: 'Network error. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast({ title: 'Invalid OTP', description: 'Please enter the complete 6-digit code', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      const { error } = await verifyOtp(pendingEmail, otp, pendingPassword);

      if (error) {
        toast({ title: 'Error verifying OTP', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Email verified', description: 'Your account is active and your password is set.' });
        setAuthView('main');
        setOtp('');
        navigate('/');
      }
    } catch {
      toast({ title: 'Error', description: 'Network error. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const { error } = await signUp(pendingEmail, pendingPassword, pendingFullName);
      if (error) {
        toast({ title: 'Error resending OTP', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'OTP resent', description: 'Check your email for the new 6-digit code.' });
      }
    } catch {
      toast({ title: 'Error', description: 'Network error. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const resetToMain = () => {
    setAuthView('main');
    setOtp('');
    setPendingEmail('');
    setPendingPassword('');
    setPendingFullName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setInlineError('');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({ title: 'Email required', description: 'Please enter your email address', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      const { error } = await resetPassword(email);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Reset email sent', description: 'Check your email for the password reset link.' });
        setEmail('');
      }
    } catch {
      toast({ title: 'Error', description: 'Network error. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', description: 'Please ensure both passwords are the same', variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'Password too short', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      const { error } = await updatePassword(password);
      if (error) {
        toast({ title: 'Error updating password', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Password updated', description: 'Your password has been reset successfully.' });
        navigate('/');
      }
    } catch {
      toast({ title: 'Error', description: 'Network error. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const goToForgotPassword = () => {
    setInlineError('');
    setAuthView('forgot-password');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <Calendar className="h-8 w-8 text-primary mr-2" />
          <h1 className="text-2xl font-bold">LifeTrack 365</h1>
        </div>
        
        {/* Reset Password Screen */}
        {authView === 'reset-password' && (
          <Card>
            <CardHeader>
              <CardTitle>Set New Password</CardTitle>
              <CardDescription>Enter your new password below</CardDescription>
            </CardHeader>
            <form onSubmit={handleUpdatePassword}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <PasswordInput id="new-password" placeholder="Enter new password (min 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <PasswordInput id="confirm-password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} autoComplete="new-password" />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Password'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        {/* Forgot Password Screen */}
        {authView === 'forgot-password' && (
          <Card>
            <CardHeader>
              <CardTitle>Reset Password</CardTitle>
              <CardDescription>Enter your email and we'll send you a reset link</CardDescription>
            </CardHeader>
            <form onSubmit={handleForgotPassword}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input id="reset-email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={loading}>
                  <Mail className="h-4 w-4 mr-2" />
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
                <Button type="button" variant="outline" className="w-full" onClick={resetToMain}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Sign In
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        {/* OTP Verification Screen */}
        {authView === 'otp' && (
          <Card>
            <CardHeader>
              <CardTitle>Verify Your Email</CardTitle>
              <CardDescription>Enter the 6-digit code sent to your email</CardDescription>
            </CardHeader>
            <form onSubmit={handleVerifyOtp}>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground mb-4">
                  OTP sent to: <span className="font-medium text-foreground">{pendingEmail}</span>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otp-code">Enter OTP Code</Label>
                  <div className="flex justify-center py-4">
                    <InputOTP maxLength={6} value={otp} onChange={(value) => setOtp(value)}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                  {loading ? 'Verifying...' : 'Verify Email'}
                </Button>
                <div className="flex gap-2 w-full">
                  <Button type="button" variant="outline" className="flex-1" onClick={resetToMain}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button type="button" variant="ghost" className="flex-1" onClick={handleResendOtp} disabled={loading}>
                    Resend OTP
                  </Button>
                </div>
              </CardFooter>
            </form>
          </Card>
        )}

        {/* Main Auth Screen */}
        {authView === 'main' && (
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <Card>
                <CardHeader>
                  <CardTitle>Sign In</CardTitle>
                  <CardDescription>Enter your credentials to access your account</CardDescription>
                </CardHeader>
                <form onSubmit={handleSignIn}>
                  <CardContent className="space-y-4">
                    {inlineError && (
                      <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                        <div>
                          <p>{inlineError}</p>
                          <Button type="button" variant="link" className="h-auto p-0 text-destructive underline text-sm" onClick={goToForgotPassword}>
                            Reset password →
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input id="signin-email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <PasswordInput id="signin-password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-3">
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                    <Button type="button" variant="link" className="text-sm text-muted-foreground" onClick={goToForgotPassword}>
                      Forgot your password?
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
            
            <TabsContent value="signup">
              <Card>
                <CardHeader>
                  <CardTitle>Sign Up</CardTitle>
                  <CardDescription>Create a new account (we'll email a 6-digit OTP to verify you)</CardDescription>
                </CardHeader>
                <form onSubmit={handleSignUp}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input id="signup-name" type="text" placeholder="Enter your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input id="signup-email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <PasswordInput id="signup-password" placeholder="Create a password (min 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Creating account...' : 'Sign Up & Get OTP'}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Auth;
