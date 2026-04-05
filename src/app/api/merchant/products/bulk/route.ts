import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const SUPPORTED_PLATFORMS = ['taobao', 'jd', 'pinduoduo', 'douyin', 'xiaohongshu', 'kuaishou'] as const;
type SupportedPlatform = (typeof SUPPORTED_PLATFORMS)[number];

const PLATFORM_LABELS: Record<SupportedPlatform, string> = {
  taobao: 'Taobao',
  jd: 'JD',
  pinduoduo: 'Pinduoduo',
  douyin: 'Douyin',
  xiaohongshu: 'Xiaohongshu',
  kuaishou: 'Kuaishou',
};

type ImportRow = {
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  status: 'active' | 'inactive';
  model: string;
  color: string;
  series: string;
};

function sanitizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function parsePlatform(value: string | null): SupportedPlatform {
  const normalized = sanitizeText(value).toLowerCase() as SupportedPlatform;
  if (SUPPORTED_PLATFORMS.includes(normalized)) {
    return normalized;
  }
  return 'taobao';
}

function normalizeStatus(value: string): 'active' | 'inactive' {
  const input = value.trim().toLowerCase();
  if (input === 'inactive' || input === 'down' || input === 'off' || input === '下架') {
    return 'inactive';
  }
  return 'active';
}

function csvEscape(value: string): string {
  if (value.includes('"') || value.includes(',') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function makeCsv(headers: string[], rows: string[][]): string {
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(row.map((cell) => csvEscape(cell)).join(','));
  }
  return `\uFEFF${lines.join('\n')}`;
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      cells.push(current);
      current = '';
      continue;
    }

    current += char;
  }
  cells.push(current);
  return cells.map((cell) => cell.trim());
}

function parseCsv(csv: string): Record<string, string>[] {
  const normalized = csv.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  if (!normalized) return [];

  const lines = normalized.split('\n').filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((header) => header.replace(/^\uFEFF/, '').trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const values = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });
    rows.push(row);
  }

  return rows;
}

function pickValue(row: Record<string, string>, keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

function mapImportRow(row: Record<string, string>): ImportRow {
  const title = pickValue(row, ['title', '商品标题', 'product_title', '名称']);
  const description = pickValue(row, ['description', '商品描述', 'desc', '详情']);
  const category = pickValue(row, ['category', '类目', '商品类目']);
  const imageUrl = pickValue(row, ['image_url', '图片链接', '主图', '主图链接']);
  const status = normalizeStatus(pickValue(row, ['status', '上架状态']));
  const model = pickValue(row, ['model', '型号', '机型']);
  const color = pickValue(row, ['color', '颜色']);
  const series = pickValue(row, ['series', '系列']);

  return { title, description, category, imageUrl, status, model, color, series };
}

async function requireMerchant() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, response: NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'merchant' && profile?.role !== 'admin') {
    return { ok: false as const, response: NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 }) };
  }

  return { ok: true as const, supabase, user };
}

export async function GET(request: Request) {
  const auth = await requireMerchant();
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const mode = sanitizeText(url.searchParams.get('mode')).toLowerCase();
  const platform = parsePlatform(url.searchParams.get('platform'));
  const platformLabel = PLATFORM_LABELS[platform];

  const headers = [
    'title',
    'description',
    'category',
    'image_url',
    'status',
    'model',
    'color',
    'series',
    'source_platform',
  ];

  if (mode === 'template') {
    const templateRows = [
      ['iPhone 15 Pro 防摔壳', 'TPU+PC 双料防摔', '手机配件', 'https://example.com/case.jpg', 'active', 'IP15PM', 'Black', 'SG-PRO', platformLabel],
      ['iPhone 15 Pro 防摔壳', 'TPU+PC 双料防摔', '手机配件', 'https://example.com/case.jpg', 'active', 'IP15PM', 'Blue', 'SG-PRO', platformLabel],
    ];
    const csv = makeCsv(headers, templateRows);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${platform}-products-template.csv"`,
      },
    });
  }

  const { supabase, user } = auth;

  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, title, description, category, status, image_url, created_at')
    .eq('merchant_id', user.id)
    .order('created_at', { ascending: false });

  if (productsError) {
    return NextResponse.json({ ok: false, message: productsError.message }, { status: 500 });
  }

  const productIds = (products ?? []).map((item) => item.id);
  const { data: variants, error: variantsError } =
    productIds.length > 0
      ? await supabase
          .from('product_variants')
          .select('product_id, model, color, series')
          .in('product_id', productIds)
      : { data: [], error: null };

  if (variantsError) {
    return NextResponse.json({ ok: false, message: variantsError.message }, { status: 500 });
  }

  const variantsByProduct = new Map<string, Array<{ model: string; color: string; series: string }>>();
  for (const item of variants ?? []) {
    const current = variantsByProduct.get(item.product_id) ?? [];
    current.push({
      model: item.model ?? '',
      color: item.color ?? '',
      series: item.series ?? '',
    });
    variantsByProduct.set(item.product_id, current);
  }

  const rows: string[][] = [];
  for (const product of products ?? []) {
    const productVariants = variantsByProduct.get(product.id) ?? [];
    const base = [
      product.title ?? '',
      product.description ?? '',
      product.category ?? '',
      (product as { image_url?: string | null }).image_url ?? '',
      normalizeStatus(product.status ?? 'active'),
    ];

    if (productVariants.length === 0) {
      rows.push([...base, '', '', '', platformLabel]);
      continue;
    }

    for (const variant of productVariants) {
      rows.push([...base, variant.model, variant.color, variant.series, platformLabel]);
    }
  }

  const csv = makeCsv(headers, rows);
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${platform}-products-export.csv"`,
    },
  });
}

export async function POST(request: Request) {
  const auth = await requireMerchant();
  if (!auth.ok) return auth.response;

  const { supabase, user } = auth;

  const body = (await request.json().catch(() => ({}))) as {
    platform?: unknown;
    csv?: unknown;
  };
  const csv = sanitizeText(body.csv);

  if (!csv) {
    return NextResponse.json({ ok: false, message: 'CSV content is required.' }, { status: 400 });
  }

  const rawRows = parseCsv(csv);
  const rows = rawRows.map(mapImportRow);

  let createdProducts = 0;
  let updatedProducts = 0;
  let createdVariants = 0;
  let skippedRows = 0;
  let failedRows = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    if (!row.title) {
      skippedRows += 1;
      continue;
    }

    try {
      const { data: existingProducts, error: findError } = await supabase
        .from('products')
        .select('id')
        .eq('merchant_id', user.id)
        .eq('title', row.title)
        .limit(1);

      if (findError) {
        throw new Error(findError.message);
      }

      let productId = existingProducts?.[0]?.id ?? null;

      if (productId) {
        const { error: updateError } = await supabase
          .from('products')
          .update({
            description: row.description || null,
            category: row.category || null,
            image_url: row.imageUrl || null,
            status: row.status,
          })
          .eq('id', productId)
          .eq('merchant_id', user.id);
        if (updateError) {
          throw new Error(updateError.message);
        }
        updatedProducts += 1;
      } else {
        const { data: insertedProduct, error: insertError } = await supabase
          .from('products')
          .insert({
            merchant_id: user.id,
            title: row.title,
            description: row.description || null,
            category: row.category || null,
            image_url: row.imageUrl || null,
            status: row.status,
          })
          .select('id')
          .single();
        if (insertError || !insertedProduct) {
          throw new Error(insertError?.message || 'Failed to insert product.');
        }
        productId = insertedProduct.id;
        createdProducts += 1;
      }

      if (productId && (row.model || row.color || row.series)) {
        const { data: existingVariant, error: findVariantError } = await supabase
          .from('product_variants')
          .select('id')
          .eq('product_id', productId)
          .eq('model', row.model || null)
          .eq('color', row.color || null)
          .eq('series', row.series || null)
          .limit(1);

        if (findVariantError) {
          throw new Error(findVariantError.message);
        }

        if (!existingVariant || existingVariant.length === 0) {
          const { error: variantInsertError } = await supabase.from('product_variants').insert({
            product_id: productId,
            model: row.model || null,
            color: row.color || null,
            series: row.series || null,
          });
          if (variantInsertError) {
            throw new Error(variantInsertError.message);
          }
          createdVariants += 1;
        }
      }
    } catch (error) {
      failedRows += 1;
      const reason = error instanceof Error ? error.message : 'unknown error';
      errors.push(`第 ${i + 2} 行失败：${reason}`);
    }
  }

  return NextResponse.json({
    ok: true,
    platform: parsePlatform(typeof body.platform === 'string' ? body.platform : null),
    summary: {
      totalRows: rows.length,
      createdProducts,
      updatedProducts,
      createdVariants,
      skippedRows,
      failedRows,
      errors: errors.slice(0, 20),
    },
  });
}
