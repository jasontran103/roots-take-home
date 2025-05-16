import { prisma } from '@/lib/prisma'
import { Listing, ListingStatus, PropertyType, Prisma } from '@/generated/prisma'

export type CreateListingInput = {
  id: string
  mlsProviderId: string
  parcelNumber: string
  zipCode: string
  rawDataHash: string
  mlsListingId: string
  status: ListingStatus
  price: number
  propertyType: PropertyType
  address: string
  latitude: number
  longitude: number
  isAssumable: boolean
  unitNumber?: string
  mlsInstanceId?: string
  photoUrls?: string[]
  documentUrls?: string[]
  videoUrls?: string[]
  bedrooms?: number
  bathrooms?: number
  squareFeet?: number
  yearBuilt?: number
  city?: string
  state?: string
  listedAt?: Date
  updatedAt: Date
}

export type UpdateListingInput = Partial<CreateListingInput> & {
  id: string
}

export type ViewportBounds = {
  north: number
  south: number
  east: number
  west: number
}

export class ListingService {
  async create(data: CreateListingInput) {
    return prisma.listing.create({
      data
    })
  }

  async findAll(viewport?: ViewportBounds, page = 1, limit = 100) {
    const skip = (page - 1) * limit

    const where = {
      status: {
        in: [ListingStatus.ACTIVE, ListingStatus.PENDING]
      },
      ...(viewport && {
        latitude: {
          gte: viewport.south,
          lte: viewport.north
        },
        longitude: {
          gte: viewport.west,
          lte: viewport.east
        }
      })
    }

    console.log('FindAll query:', { where, skip, limit })

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        select: {
          id: true,
          mlsProviderId: true,
          parcelNumber: true,
          zipCode: true,
          mlsListingId: true,
          status: true,
          price: true,
          propertyType: true,
          address: true,
          latitude: true,
          longitude: true,
          isAssumable: true,
          unitNumber: true,
          mlsInstanceId: true,
          photoUrls: true,
          documentUrls: true,
          videoUrls: true,
          bedrooms: true,
          bathrooms: true,
          squareFeet: true,
          yearBuilt: true,
          city: true,
          state: true,
          listedAt: true,
          updatedAt: true,
          createdAt: true
        },
        skip,
        take: limit,
        orderBy: {
          price: 'asc'
        }
      }),
      prisma.listing.count({ where })
    ])

    console.log('FindAll result:', { total, listingsCount: listings.length })

    return {
      listings,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    }
  }

  async findById(id: string) {
    return prisma.listing.findUnique({
      where: { id },
      select: {
        id: true,
        mlsProviderId: true,
        parcelNumber: true,
        zipCode: true,
        mlsListingId: true,
        status: true,
        price: true,
        propertyType: true,
        address: true,
        latitude: true,
        longitude: true,
        isAssumable: true,
        unitNumber: true,
        mlsInstanceId: true,
        photoUrls: true,
        documentUrls: true,
        videoUrls: true,
        bedrooms: true,
        bathrooms: true,
        squareFeet: true,
        yearBuilt: true,
        city: true,
        state: true,
        listedAt: true,
        updatedAt: true,
        createdAt: true
      }
    })
  }

  async update({ id, ...data }: UpdateListingInput) {
    return prisma.listing.update({
      where: { id },
      data
    })
  }

  async delete(id: string) {
    return prisma.listing.delete({
      where: { id }
    })
  }

  async search(query: string, viewport?: ViewportBounds, page = 1, limit = 100) {
    const skip = (page - 1) * limit

    const where: Prisma.ListingWhereInput = {
      OR: [
        { address: { contains: query, mode: Prisma.QueryMode.insensitive } },
        { mlsListingId: { contains: query, mode: Prisma.QueryMode.insensitive } },
        { remarks: { path: ['$'], string_contains: query, mode: Prisma.QueryMode.insensitive } }
      ],
      status: {
        in: [ListingStatus.ACTIVE, ListingStatus.PENDING]
      },
      ...(viewport && {
        latitude: {
          gte: viewport.south,
          lte: viewport.north
        },
        longitude: {
          gte: viewport.west,
          lte: viewport.east
        }
      })
    }

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        select: {
          id: true,
          mlsProviderId: true,
          parcelNumber: true,
          zipCode: true,
          mlsListingId: true,
          status: true,
          price: true,
          propertyType: true,
          address: true,
          latitude: true,
          longitude: true,
          isAssumable: true,
          unitNumber: true,
          mlsInstanceId: true,
          photoUrls: true,
          documentUrls: true,
          videoUrls: true,
          bedrooms: true,
          bathrooms: true,
          squareFeet: true,
          yearBuilt: true,
          city: true,
          state: true,
          listedAt: true,
          updatedAt: true,
          createdAt: true
        },
        skip,
        take: limit,
        orderBy: {
          price: 'asc'
        }
      }),
      prisma.listing.count({ where })
    ])

    return {
      listings,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    }
  }
} 