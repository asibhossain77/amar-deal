'use client';

import { useEffect, useState, useMemo } from 'react';
import { Users, Search, UserCog } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

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
    try {
      setTogglingId(user.id);
      await api.toggleUserStatus(user.id, !user.isActive);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, isActive: !u.isActive } : u
        )
      );
    } catch (err) {
      console.error('Failed to toggle user status:', err);
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
          <UserCog className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ব্যবহারকারী ব্যবস্থাপনা</h1>
          <p className="text-sm text-gray-500">সকল নিবন্ধিত ব্যবহারকারীদের ব্যবস্থাপনা</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="নাম, ইমেইল বা ভূমিকা দিয়ে খুঁজুন..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Users Table */}
      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-40 rounded bg-gray-200 animate-pulse" />
                    <div className="h-3 w-56 rounded bg-gray-200 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      ) : filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="mx-auto mb-2 h-10 w-10 text-gray-300" />
            <p className="text-gray-500">কোনো ব্যবহারকারী পাওয়া যায়নি</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
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
                      <TableCell className="text-gray-600">{user.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={user.role === 'admin' ? 'default' : 'secondary'}
                          className={user.role === 'admin' ? 'bg-blue-600' : ''}
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
                      <TableCell className="text-gray-600">
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
