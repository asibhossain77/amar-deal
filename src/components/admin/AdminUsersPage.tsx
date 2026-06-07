'use client';

import { useEffect, useState, useMemo } from 'react';
import { Users, Search, UserCog } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/shared/PageHeader';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/helpers';
import type { AppUser } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        const data = await api.getAdminUsers();
        setUsers(data.users || data);
      } catch (err) {
        setError('ব্যবহারকারী তালিকা লোড করতে সমস্যা হয়েছে');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [users, search]);

  async function handleToggleStatus(user: AppUser) {
    const newStatus = !user.isActive;
    try {
      setTogglingId(user.id);
      await api.toggleUserStatus(user.id, newStatus);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, isActive: newStatus } : u
        )
      );
      toast({
        title: 'সফল!',
        description: newStatus
          ? `${user.name} সক্রিয় করা হয়েছে`
          : `${user.name} নিষ্ক্রিয় করা হয়েছে`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'স্ট্যাটাস পরিবর্তন করতে সমস্যা হয়েছে';
      console.error('Failed to toggle user status:', err);
      toast({
        title: 'ত্রুটি',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="page-container space-y-6">
      <PageHeader
        title="ব্যবহারকারী ব্যবস্থাপনা"
        subtitle="সকল নিবন্ধিত ব্যবহারকারীদের ব্যবস্থাপনা"
        icon={<UserCog className="h-5 w-5 text-primary" />}
      />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="নাম, ইমেইল বা ভূমিকা দিয়ে খুঁজুন..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Users Table */}
      {loading ? (
        <Card className="card-modern">
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-40 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-56 rounded bg-muted animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="card-modern">
          <CardContent className="p-6 text-center">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      ) : filteredUsers.length === 0 ? (
        <Card className="card-modern">
          <CardContent className="p-6 text-center">
            <Users className="mx-auto mb-2 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">কোনো ব্যবহারকারী পাওয়া যায়নি</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="text-base">
              মোট ব্যবহারকারী: {filteredUsers.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>নাম</TableHead>
                    <TableHead>ইমেইল</TableHead>
                    <TableHead>ভূমিকা</TableHead>
                    <TableHead>অবস্থা</TableHead>
                    <TableHead>নিবন্ধন তারিখ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={user.role === 'admin' ? 'default' : 'secondary'}
                          className={user.role === 'admin' ? 'bg-primary' : ''}
                        >
                          {user.role === 'admin' ? 'প্রশাসক' : 'ব্যবহারকারী'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={user.isActive}
                            onCheckedChange={() => handleToggleStatus(user)}
                            disabled={togglingId === user.id}
                          />
                          <Badge
                            variant="outline"
                            className={
                              user.isActive
                                ? 'border-green-300 bg-green-50 text-green-700'
                                : 'border-red-300 bg-red-50 text-red-700'
                            }
                          >
                            {user.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
