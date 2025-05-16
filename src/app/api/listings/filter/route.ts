import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PropertyType } from '@/generated/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const propertyType = searchParams.get('propertyType') as PropertyType | null
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')
  const limit = parseInt(searchParams.get('limit') || '10')
  const page = parseInt(searchParams.get('page') || '1')
  const skip = (page - 1) * limit

  try {
    const where = {
      ...(propertyType && { propertyType }),
      ...(minPrice && { price: { gte: parseFloat(minPrice) } }),
      ...(maxPrice && { price: { lte: parseFloat(maxPrice) } }),
      deletedAt: null,
    }

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        take: limit,
        skip,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          address: true,
          city: true,
          state: true,
          price: true,
          bedrooms: true,
          bathrooms: true,
          squareFeet: true,
          propertyType: true,
          photoUrls: true,
          status: true,
          createdAt: true,
          longitude: true,
          latitude: true,
          isAssumable: true,
        }
      }),
      prisma.listing.count({ where })
    ])

    return NextResponse.json({
      listings,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        limit
      }
    })
  } catch (error) {
    console.error('Error fetching filtered listings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch filtered listings' },
      { status: 500 }
    )
  }
} 