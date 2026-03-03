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
import { Loader2, UserPlus, Trash2, Building2, Pencil, Plus } from 'lucide-react';
import { useCuentas, useCreateCuenta, useUpdateCuenta, useDeleteCuenta } from '@/hooks/useCuentas';

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

  // Cuentas
  const { data: cuentas = [], isLoading: cuentasLoading } = useCuentas();
  const createCuenta = useCreateCuenta();
  const updateCuenta = useUpdateCuenta();
  const deleteCuenta = useDeleteCuenta();
  const [newCuentaNombre, setNewCuentaNombre] = useState('');
  const [editingCuenta, setEditingCuenta] = useState<{ id: string; nombre: string } | null>(null);

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

  const handleCreateCuenta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCuentaNombre.trim()) return;
    try {
      await createCuenta.mutateAsync(newCuentaNombre.trim());
      toast.success('Cuenta creada');
      setNewCuentaNombre('');
    } catch { toast.error('Error al crear cuenta'); }
  };

  const handleSaveEditCuenta = async () => {
    if (!editingCuenta || !editingCuenta.nombre.trim()) return;
    try {
      await updateCuenta.mutateAsync({ id: editingCuenta.id, nombre: editingCuenta.nombre.trim() });
      toast.success('Cuenta actualizada');
      setEditingCuenta(null);
    } catch { toast.error('Error al actualizar'); }
  };

  const handleDeleteCuenta = async (id: string) => {
    if (!confirm('¿Eliminar esta cuenta? Las publicaciones asociadas perderán la referencia.')) return;
    try {
      await deleteCuenta.mutateAsync(id);
      toast.success('Cuenta eliminada');
    } catch { toast.error('Error al eliminar'); }
  };

  return (
    <div className="space-y-6">
      {/* Cuentas de clientes */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="h-5 w-5" /> Cuentas de clientes</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleCreateCuenta} className="flex items-end gap-3">
            <div className="space-y-1 flex-1">
              <Label className="text-xs">Nombre del cliente</Label>
              <Input value={newCuentaNombre} onChange={e => setNewCuentaNombre(e.target.value)} required placeholder="Ej: Marca XYZ" />
            </div>
            <Button type="submit" size="sm" disabled={createCuenta.isPending} className="gap-1.5">
              {createCuenta.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4" /> Agregar</>}
            </Button>
          </form>
          {cuentasLoading ? <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cuentas.length === 0 ? (
                  <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-4">No hay cuentas creadas</TableCell></TableRow>
                ) : cuentas.map(c => (
                  <TableRow key={c.id}>
                    <TableCell>
                      {editingCuenta?.id === c.id ? (
                        <div className="flex gap-2">
                          <Input value={editingCuenta.nombre} onChange={e => setEditingCuenta({ ...editingCuenta, nombre: e.target.value })} className="h-8" onKeyDown={e => { if (e.key === 'Enter') handleSaveEditCuenta(); if (e.key === 'Escape') setEditingCuenta(null); }} autoFocus />
                          <Button size="sm" variant="ghost" onClick={handleSaveEditCuenta}>✓</Button>
                        </div>
                      ) : c.nombre}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingCuenta({ id: c.id, nombre: c.nombre })}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteCuenta(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Crear usuario */}
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

      {/* Usuarios */}
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
