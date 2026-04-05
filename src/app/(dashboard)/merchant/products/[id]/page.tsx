'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Variant = {
  id?: string;
  model: string;
  color: string;
  series: string;
};

type ProductForm = {
  title: string;
  description: string;
  category: string;
  image_url: string;
  status: 'active' | 'inactive';
};

function normalizeStatus(value: unknown): 'active' | 'inactive' {
  return value === 'inactive' ? 'inactive' : 'active';
}

function emptyVariant(): Variant {
  return { model: '', color: '', series: '' };
}

export default function MerchantProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const productId = useMemo(() => String(params.id || ''), [params.id]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [product, setProduct] = useState<ProductForm>({
    title: '',
    description: '',
    category: '',
    image_url: '',
    status: 'active',
  });
  const [variants, setVariants] = useState<Variant[]>([emptyVariant()]);
  const [originalVariantIds, setOriginalVariantIds] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      setMessage('');

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('id, title, description, category, status, image_url')
        .eq('id', productId)
        .eq('merchant_id', user.id)
        .single();

      if (productError || !productData) {
        setError(productError?.message || '未找到该商品，或无权限访问。');
        setLoading(false);
        return;
      }

      const { data: variantsData, error: variantsError } = await supabase
        .from('product_variants')
        .select('id, model, color, series')
        .eq('product_id', productId)
        .order('created_at', { ascending: true });

      if (variantsError) {
        setError(variantsError.message);
        setLoading(false);
        return;
      }

      setProduct({
        title: productData.title ?? '',
        description: productData.description ?? '',
        category: productData.category ?? '',
        image_url: (productData as { image_url?: string | null }).image_url ?? '',
        status: normalizeStatus(productData.status),
      });

      const loadedVariants =
        variantsData && variantsData.length > 0
          ? variantsData.map((item) => ({
              id: item.id,
              model: item.model ?? '',
              color: item.color ?? '',
              series: item.series ?? '',
            }))
          : [emptyVariant()];

      setVariants(loadedVariants);
      setOriginalVariantIds((variantsData ?? []).map((item) => item.id));
      setLoading(false);
    };

    void load();
  }, [productId, router, supabase]);

  const addVariant = () => setVariants((prev) => [...prev, emptyVariant()]);

  const updateVariant = (index: number, field: keyof Variant, value: string) => {
    setVariants((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const removeVariant = (index: number) => {
    setVariants((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      return next.length > 0 ? next : [emptyVariant()];
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setMessage('');

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    if (!product.title.trim()) {
      setError('商品标题不能为空。');
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from('products')
      .update({
        title: product.title.trim(),
        description: product.description.trim() || null,
        category: product.category.trim() || null,
        image_url: product.image_url.trim() || null,
        status: product.status,
      })
      .eq('id', productId)
      .eq('merchant_id', user.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    const validVariants = variants
      .map((item) => ({
        id: item.id,
        model: item.model.trim(),
        color: item.color.trim(),
        series: item.series.trim(),
      }))
      .filter((item) => item.model || item.color || item.series);

    const keepIds = validVariants
      .map((item) => item.id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);

    const deleteIds = originalVariantIds.filter((id) => !keepIds.includes(id));
    if (deleteIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('product_variants')
        .delete()
        .in('id', deleteIds)
        .eq('product_id', productId);
      if (deleteError) {
        setError(deleteError.message);
        setSaving(false);
        return;
      }
    }

    for (const item of validVariants) {
      if (item.id) {
        const { error: variantUpdateError } = await supabase
          .from('product_variants')
          .update({
            model: item.model || null,
            color: item.color || null,
            series: item.series || null,
          })
          .eq('id', item.id)
          .eq('product_id', productId);
        if (variantUpdateError) {
          setError(variantUpdateError.message);
          setSaving(false);
          return;
        }
      } else {
        const { error: variantInsertError } = await supabase.from('product_variants').insert({
          product_id: productId,
          model: item.model || null,
          color: item.color || null,
          series: item.series || null,
        });
        if (variantInsertError) {
          setError(variantInsertError.message);
          setSaving(false);
          return;
        }
      }
    }

    setMessage(product.status === 'active' ? '商品已保存并保持上架。' : '商品已保存并保持下架。');
    setSaving(false);

    const { data: variantsData } = await supabase
      .from('product_variants')
      .select('id, model, color, series')
      .eq('product_id', productId)
      .order('created_at', { ascending: true });

    setVariants(
      variantsData && variantsData.length > 0
        ? variantsData.map((item) => ({
            id: item.id,
            model: item.model ?? '',
            color: item.color ?? '',
            series: item.series ?? '',
          }))
        : [emptyVariant()]
    );
    setOriginalVariantIds((variantsData ?? []).map((item) => item.id));
  };

  const toggleStatus = async () => {
    setProduct((prev) => ({ ...prev, status: prev.status === 'active' ? 'inactive' : 'active' }));
    setMessage('');
  };

  if (loading) {
    return <div className="p-6 text-muted-foreground">加载商品详情中...</div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">商品详情与上架</h1>
          <p className="text-muted-foreground">编辑单品信息、规格，并控制上架状态。</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/merchant/products')}>
          返回商品列表
        </Button>
      </div>

      {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {message && <div className="rounded-md bg-green-100 p-3 text-sm text-green-700">{message}</div>}

      <Card>
        <CardHeader>
          <CardTitle>商品基础信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>商品标题 *</Label>
            <Input
              value={product.title}
              onChange={(e) => setProduct((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="例如：iPhone 15 Pro 防摔壳"
            />
          </div>
          <div className="space-y-2">
            <Label>商品描述</Label>
            <Textarea
              value={product.description}
              onChange={(e) => setProduct((prev) => ({ ...prev, description: e.target.value }))}
              rows={4}
              placeholder="填写商品卖点、材质、适配机型等信息"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>类目</Label>
              <Input
                value={product.category}
                onChange={(e) => setProduct((prev) => ({ ...prev, category: e.target.value }))}
                placeholder="例如：手机配件"
              />
            </div>
            <div className="space-y-2">
              <Label>主图链接</Label>
              <Input
                value={product.image_url}
                onChange={(e) => setProduct((prev) => ({ ...prev, image_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" onClick={toggleStatus}>
              {product.status === 'active' ? '切换为下架' : '切换为上架'}
            </Button>
            <span className="text-sm text-muted-foreground">
              当前状态：{product.status === 'active' ? '上架中' : '已下架'}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>商品规格（Variants）</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addVariant}>
              + 添加规格
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {variants.map((variant, index) => (
            <div key={variant.id ?? `new-${index}`} className="grid grid-cols-4 gap-2 items-end">
              <div className="space-y-1">
                <Label className="text-xs">型号</Label>
                <Input
                  value={variant.model}
                  onChange={(e) => updateVariant(index, 'model', e.target.value)}
                  placeholder="IP15PM"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">颜色</Label>
                <Input
                  value={variant.color}
                  onChange={(e) => updateVariant(index, 'color', e.target.value)}
                  placeholder="Black"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">系列</Label>
                <Input
                  value={variant.series}
                  onChange={(e) => updateVariant(index, 'series', e.target.value)}
                  placeholder="SG-PRO"
                />
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeVariant(index)}>
                删除
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving ? '保存中...' : '保存商品'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/merchant/products/bulk')}>
          批量导入/导出入口
        </Button>
      </div>
    </div>
  );
}
