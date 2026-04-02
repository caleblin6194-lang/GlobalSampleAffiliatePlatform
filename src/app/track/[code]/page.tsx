import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Image from "next/image";

export default async function TrackPage({
  params,
}: {
  params: { code: string };
}) {
  const supabase = await createClient();
  const headersList = headers();

  // Find affiliate link by code
  const { data: affiliateLink, error } = await supabase
    .from("affiliate_links")
    .select(`
      id, code, target_path, is_active,
      creator_id,
      campaign:campaigns(id, title, description, status,
        product:products(id, title, description, image_url, category)
      )
    `)
    .eq("code", params.code)
    .eq("is_active", true)
    .single();

  if (error || !affiliateLink) {
    redirect("/");
  }

  // Check campaign is active
  const campaign = affiliateLink.campaign as unknown as {
    id: string;
    title: string;
    description: string;
    status: string;
    product: any;
  };

  if (!campaign || campaign.status !== "active") {
    redirect("/");
  }

  // Record the click (async)
  const referer = headersList.get("referer") || null;
  const userAgent = headersList.get("user-agent") || null;

  await supabase.from("clicks").insert({
    affiliate_link_id: affiliateLink.id,
    creator_id: affiliateLink.creator_id,
    campaign_id: campaign.id,
    referrer: referer,
    user_agent: userAgent,
  });

  const product = campaign.product;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {campaign.title}
          </h1>
          {campaign.description && (
            <p className="text-gray-600">{campaign.description}</p>
          )}
        </div>

        {/* Product Card */}
        {product && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
            {product.image_url && (
              <div className="relative w-full h-64">
                <Image
                  src={product.image_url}
                  alt={product.title || "Product image"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 768px"
                />
              </div>
            )}
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-2">{product.title}</h2>
              {product.description && (
                <p className="text-gray-600 mb-4">{product.description}</p>
              )}
              {product.category && (
                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                  {product.category}
                </span>
              )}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-4">
            🎁 Special offer available via this link!
          </p>
          <a
            href={`/campaigns/${campaign.id}`}
            className="inline-block px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Campaign
          </a>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-xs text-gray-400">
          <p>Affiliate tracking: {params.code}</p>
        </div>
      </div>
    </div>
  );
}
