'use client';

import { useEffect, useState } from 'react';
import { ScrollText, Clock, User, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { formatDate, timeAgo } from '@/lib/helpers';
import type { AdminLog } from '@/lib/types';

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLogs() {
      try {
        setLoading(true);
        const data = await api.getAdminLogs();
        setLogs(data.logs || data);
      } catch (err) {
        setError('লগ লোড করতে সমস্যা হয়েছে');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  function getActionBadge(action: string) {
    const lower = action.toLowerCase();
    if (lower.includes('approve') || lower.includes('অনুমোদন')) {
      return (
        <Badge variant="outline" className="border-green-300 bg-green-50 text-green-700">
          {action}
        </Badge>
      );
    }
    if (lower.includes('reject') || lower.includes('প্রত্যাখ্যান')) {
      return (
        <Badge variant="outline" className="border-red-300 bg-red-50 text-red-700">
          {action}
        </Badge>
      );
    }
    if (lower.includes('toggle') || lower.includes('সক্রিয়') || lower.includes('নিষ্ক্রিয়')) {
      return (
        <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-700">
          {action}
        </Badge>
      );
    }
    if (lower.includes('resolve') || lower.includes('সমাধান')) {
      return (
        <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
          {action}
        </Badge>
      );
    }
    return <Badge variant="secondary">{action}</Badge>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
          <ScrollText className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">কার্যক্রম লগ</h1>
          <p className="text-sm text-gray-500">প্রশাসকদের সকল কার্যক্রমের রেকর্ড</p>
        </div>
      </div>

      {/* Logs */}
      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 rounded bg-gray-200 animate-pulse" />
                    <div className="h-3 w-32 rounded bg-gray-200 animate-pulse" />
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
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <ScrollText className="mx-auto mb-2 h-10 w-10 text-gray-300" />
            <p className="text-gray-500">কোনো লগ পাওয়া যায়নি</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-gray-500" />
              সর্বশেষ কার্যক্রম
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>প্রশাসক</TableHead>
                    <TableHead>কার্যক্রম</TableHead>
                    <TableHead>বিবরণ</TableHead>
                    <TableHead>সময়</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100">
                            <User className="h-3.5 w-3.5 text-blue-600" />
                          </div>
                          <span className="font-medium text-gray-900">
                            {log.user?.name || 'অজানা'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>
                        <div className="flex items-start gap-1.5 max-w-xs">
                          <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                          <span className="text-sm text-gray-600 truncate">
                            {log.details}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="text-gray-700">{formatDate(log.createdAt)}</div>
                          <div className="text-xs text-gray-400">{timeAgo(log.createdAt)}</div>
                        </div>
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
