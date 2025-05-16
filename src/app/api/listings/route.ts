import { NextRequest, NextResponse } from 'next/server'
import { ListingService } from '@/services/listing.service'
import { ViewportBounds } from '@/services/listing.service'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@/generated/prisma'

const listingService = new ListingService()

// Helper function to handle BigInt serialization prisma returns BigInts for the id field
function serializeListing(listing: any) {
  return JSON.parse(JSON.stringify(listing, (_, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ))
}

export async function GET(request: Request) {
  // Parses the URL to get the query string it will be in the format of ?page=1&limit=50&viewport=viewport
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const viewport = searchParams.get('viewport')
  
  try {
    let where: Prisma.ListingWhereInput = {
      deletedAt: null,
    }

    // Add viewport filtering so we will only show listings within the visible area of the map
    if (viewport) {
      const { north, south, east, west } = JSON.parse(viewport)
      where = {
        ...where,
        latitude: {
          gte: south,
          lte: north,
        },
        longitude: {
          gte: west,
          lte: east,
        },
      }
    }

    // Grab the listings for the current page 
    const [listings, total] = await Promise.all([ // We use Promise.all to fetch the listings and the total number of listings simultaneously
      prisma.listing.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
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
          listedAt: true,
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
    console.error('Error fetching listings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const listing = await listingService.create(data)
    return NextResponse.json(serializeListing(listing), { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/listings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const listing = await listingService.update(data)
    return NextResponse.json(serializeListing(listing))
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    await listingService.delete(id)
    return NextResponse.json({ message: 'Listing deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 })
  }
} 