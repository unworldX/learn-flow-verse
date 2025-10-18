import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import BrandLogo from '@/components/BrandLogo';
import { useNavigate } from 'react-router-dom';

export default function NewPassword() {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password || password.length < 8) {
            toast({ title: 'Invalid password', description: 'Use at least 8 characters', variant: 'destructive' });
            return;
        }
        if (password !== confirm) {
            toast({ title: 'Passwords do not match', description: 'Please re-enter to confirm', variant: 'destructive' });
            return;
        }
        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            toast({ title: 'Password updated', description: 'You can now sign in with your new password' });
            navigate('/login', { replace: true });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Try again';
            toast({ title: 'Update failed', description: message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center rounded-2xl mb-4">
                        <BrandLogo className="w-20 h-20" alt="Studylib logo" />
                    </div>
                    <h1 className="text-3xl font-bold gradient-text">Set New Password</h1>
                    <p className="text-gray-600 mt-2">Enter and confirm your new password</p>
                </div>

                <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-center">New Password</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={onSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Create a strong password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-white/50"
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm">Confirm Password</Label>
                                <Input
                                    id="confirm"
                                    type="password"
                                    placeholder="Confirm your password"
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value)}
                                    className="bg-white/50"
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <Button disabled={loading} type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                                {loading ? 'Updating...' : 'Update Password'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
