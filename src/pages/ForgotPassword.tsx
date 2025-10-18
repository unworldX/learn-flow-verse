import { useState } from 'react';
import { useAuth } from '@/contexts/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await resetPassword(email);
    if (!error) setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Reset Password</CardTitle>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-4 text-center">
                <p className="text-sm text-gray-700">If an account exists for <strong>{email}</strong>, a reset email has been sent.</p>
                <Link to="/login" className="text-blue-600 hover:underline text-sm">Return to login</Link>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@student.edu"
                    required
                    disabled={loading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/50"
                  />
                </div>
                <Button disabled={loading} type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
                <div className="text-center">
                  <Link to="/login" className="text-sm text-blue-600 hover:underline">Back to login</Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
