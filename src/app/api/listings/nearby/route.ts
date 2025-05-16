import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  // Parses the URL to get the query string it will be in the format of ?lat=123&lng=123&radius=10&limit=10
  const { searchParams } = new URL(request.url)
  const lat = parseFloat(searchParams.get('lat') || '0')
  const lng = parseFloat(searchParams.get('lng') || '0')
  const radius = parseFloat(searchParams.get('radius') || '10') // setting radius to 10km
  const limit = parseInt(searchParams.get('limit') || '10') // returning 10 listings by default

  // Error handling: Checking if latitude and longitude are provided 
  if (!lat || !lng) {
    return NextResponse.json(
      { error: 'Latitude and longitude are required' },
      { status: 400 }
    )
  }

  try {
    // Convert radius from km to degrees (approximate) 1 degree = 111.32 km at the equator)
    const radiusInDegrees = radius / 111.32

    // Query the database for listings within the radius
    const listings = await prisma.listing.findMany({
      // Only return listings that are within the radiusInDegrees above or below the latitude and longitude
      where: {
        latitude: {
          gte: lat - radiusInDegrees,
          lte: lat + radiusInDegrees
        },
        longitude: {
          gte: lng - radiusInDegrees,
          lte: lng + radiusInDegrees
        }
      },
      take: limit, // limiting the number of listings to the limit
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
    })

    // Calculate actual distance for each listing
    const listingsWithDistance = listings.map(listing => {
      const distance = calculateDistance(
        lat,
        lng,
        Number(listing.latitude),
        Number(listing.longitude)
      )
      return {
        ...listing,
        distance: Math.round(distance * 10) / 10 // rounding to 1 decimal place
      }
    })

    // Sort by distance
    listingsWithDistance.sort((a, b) => a.distance - b.distance)

    return NextResponse.json(listingsWithDistance)
  } catch (error) {
    console.error('Error fetching nearby listings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch nearby listings' },
      { status: 500 }
    )
  }
}

// Haversine formula to calculate distance between two points on Earth
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
} 