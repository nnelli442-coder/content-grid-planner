import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, UserPlus, Trash2 } from 'lucide-react';

interface UserWithRole {
  user_id: string;
  email: string;
  full_name: string | null;
  role: string;
}

export default function AdminPanel() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from('profiles').select('*');
    const { data: roles } = await supabase.from('user_roles').select('*');
    if (profiles) {
      const userList = profiles.map(p => ({
        user_id: p.user_id,
        email: p.email || '',
        full_name: p.full_name,
        role: roles?.find(r => r.user_id === p.user_id)?.role || 'user',
      }));
      setUsers(userList);
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: { email: newEmail, password: newPassword, full_name: newName, role: newRole },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Usuario creado');
      setNewEmail(''); setNewPassword(''); setNewName('');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Error al crear usuario');
    }
    setCreating(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><UserPlus className="h-5 w-5" /> Crear usuario</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div className="space-y-1">
              <Label className="text-xs">Nombre</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} required placeholder="Nombre completo" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required placeholder="email@ejemplo.com" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Contraseña</Label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required placeholder="Min. 6 caracteres" minLength={6} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Rol</Label>
              <Select value={newRole} onValueChange={v => setNewRole(v as 'admin' | 'user')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuario</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Crear'}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Usuarios registrados</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(u => (
                  <TableRow key={u.user_id}>
                    <TableCell>{u.full_name || '—'}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell><Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>{u.role}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
