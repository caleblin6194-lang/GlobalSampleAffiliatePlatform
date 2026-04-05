'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PLATFORM_OPTIONS = [
  { value: 'taobao', label: '淘宝' },
  { value: 'jd', label: '京东' },
  { value: 'pinduoduo', label: '拼多多' },
  { value: 'douyin', label: '抖音电商' },
  { value: 'xiaohongshu', label: '小红书' },
  { value: 'kuaishou', label: '快手' },
] as const;

type ImportSummary = {
  totalRows: number;
  createdProducts: number;
  updatedProducts: number;
  createdVariants: number;
  skippedRows: number;
  failedRows: number;
  errors: string[];
};

export default function MerchantProductsBulkPage() {
  const router = useRouter();
  const [platform, setPlatform] = useState<(typeof PLATFORM_OPTIONS)[number]['value']>('taobao');
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState('');

  const platformLabel = useMemo(
    () => PLATFORM_OPTIONS.find((item) => item.value === platform)?.label ?? '淘宝',
    [platform]
  );

  const downloadFile = (mode: 'template' | 'export') => {
    window.location.href = `/api/merchant/products/bulk?mode=${mode}&platform=${platform}`;
  };

  const handleImport = async () => {
    if (!file) {
      setError('请先选择一个 CSV 文件。');
      return;
    }

    setImporting(true);
    setError('');
    setSummary(null);

    try {
      const csv = await file.text();
      const response = await fetch('/api/merchant/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          csv,
        }),
      });

      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
        summary?: ImportSummary;
      };

      if (!response.ok || !result.ok || !result.summary) {
        setError(result.message || '导入失败，请检查 CSV 内容。');
        setImporting(false);
        return;
      }

      setSummary(result.summary);
    } catch (e) {
      setError(e instanceof Error ? e.message : '导入失败，请稍后重试。');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">国内平台批量导入/导出</h1>
          <p className="text-muted-foreground">
            支持淘宝、京东、拼多多、抖音电商、小红书、快手的批量商品数据入口。
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/merchant/products')}>
          返回商品列表
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>选择平台并导出</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-sm space-y-2">
            <Label>平台</Label>
            <Select value={platform} onValueChange={(value) => setPlatform(value as typeof platform)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLATFORM_OPTIONS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={() => downloadFile('template')}>
              下载 {platformLabel} 模板
            </Button>
            <Button type="button" onClick={() => downloadFile('export')}>
              导出当前商品 CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>批量导入</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>上传 CSV 文件</Label>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm"
            />
          </div>
          <Button type="button" onClick={handleImport} disabled={importing}>
            {importing ? '导入中...' : '开始导入'}
          </Button>
          {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
          {summary && (
            <div className="rounded-md bg-green-100 p-4 text-sm text-green-800 space-y-1">
              <div>总行数：{summary.totalRows}</div>
              <div>新建商品：{summary.createdProducts}</div>
              <div>更新商品：{summary.updatedProducts}</div>
              <div>新建规格：{summary.createdVariants}</div>
              <div>跳过行：{summary.skippedRows}</div>
              <div>失败行：{summary.failedRows}</div>
              {summary.errors.length > 0 && (
                <div className="pt-2 text-red-700">
                  {summary.errors.slice(0, 5).map((item) => (
                    <div key={item}>{item}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
