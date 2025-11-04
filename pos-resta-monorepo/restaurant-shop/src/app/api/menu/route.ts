import { NextResponse } from 'next/server'

type PosCategory = {
  id: string
  name: string
  position?: number
}

type PosItem = {
  id: string
  name: string
  description?: string
  price: number
  imageUrl?: string
  categoryId: string
  variants?: { name: string; price: number; isActive?: boolean }[]
  allergens?: string[]
  prepTime?: string
  isActive?: boolean
}

export async function GET() {
  const base = process.env.POS_MENU_URL
  const apiKey = process.env.POS_API_KEY || ''

  if (!base) {
    return NextResponse.json(
      { error: 'POS integration not configured (missing POS_MENU_URL)' },
      { status: 503 }
    )
  }

  // Build final URL, ensuring trailing /menu/
  // Examples:
  //  - POS_MENU_URL=/api            -> /api/menu/
  //  - POS_MENU_URL=http://localhost:4000/api -> http://localhost:4000/api/menu/
  let targetUrl: string
  try {
    // If absolute URL
    if (/^https?:\/\//i.test(base)) {
      const u = new URL(base.replace(/\/?$/, '/'))
      u.pathname = `${u.pathname.replace(/\/?$/, '/') }menu/`
      targetUrl = u.toString()
    } else {
      // Relative base like "/api"
      const normalized = base.endsWith('/') ? base : `${base}/`
      targetUrl = `${normalized}menu/`
    }
  } catch (e) {
    return NextResponse.json(
      { error: 'Invalid POS_MENU_URL format', details: String(e) },
      { status: 400 }
    )
  }

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (apiKey.trim().length > 0) {
      headers.Authorization = `Bearer ${apiKey}`
    }

    const res = await fetch(targetUrl, {
      headers,
      cache: 'no-store',
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json(
        { error: 'POS fetch failed', details: text },
        { status: 502 }
      )
    }

    const data = (await res.json()) as {
      categories: PosCategory[]
      items: PosItem[]
    }

    // Normalize into categories with items[] shape for the frontend
    const categoriesWithItems = data.categories
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        items: data.items
          .filter((it) => it.categoryId === cat.id && (it.isActive ?? true))
          .map((it) => ({
            id: it.id,
            name: it.name,
            description: it.description ?? '',
            price: it.price,
            image: it.imageUrl ?? '',
            variants: it.variants ?? [],
            allergens: it.allergens ?? [],
            prepTime: it.prepTime ?? '',
          })),
      }))

    return NextResponse.json({ categories: categoriesWithItems })
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Unexpected error fetching POS menu', details: String(e?.message ?? e) },
      { status: 500 }
    )
  }
}


