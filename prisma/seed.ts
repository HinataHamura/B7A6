import bcrypt from 'bcryptjs';
import { config } from '../src/app/config/index.js';
import { prisma } from '../src/app/lib/prisma.js';

async function main() {
  const adminEmail = config.admin.email || 'admin@roomly.com';
  const adminPassword = config.admin.password || 'Admin123!';

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, config.bcryptSaltRounds);

    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN',
        isVerified: true,
        admin: { create: { name: 'Roomly Admin' } },
      },
    });

    console.log(`Admin user created: ${adminEmail}`);
  } else {
    console.log('Admin user already exists, skipping.');
  }

  const landlordEmail = 'landlord.demo@roomly.com';
  let landlordUser = await prisma.user.findUnique({ where: { email: landlordEmail } });

  if (!landlordUser) {
    const hashedPassword = await bcrypt.hash('Landlord123!', config.bcryptSaltRounds);
    landlordUser = await prisma.user.create({
      data: {
        email: landlordEmail,
        password: hashedPassword,
        role: 'LANDLORD',
        isVerified: true,
        landlordProfile: {
          create: {
            name: 'Karim Rahman',
            phone: '01711111111',
            bio: 'Verified host with 3 properties in Dhaka',
            isVerifiedHost: true,
          },
        },
      },
      include: { landlordProfile: true },
    });
    console.log(`Demo landlord created: ${landlordEmail}`);
  }

  const tenantEmail = 'tenant.demo@roomly.com';
  let tenantUser = await prisma.user.findUnique({ where: { email: tenantEmail } });

  if (!tenantUser) {
    const hashedPassword = await bcrypt.hash('Tenant123!', config.bcryptSaltRounds);
    tenantUser = await prisma.user.create({
      data: {
        email: tenantEmail,
        password: hashedPassword,
        role: 'TENANT',
        isVerified: true,
        tenantProfile: {
          create: {
            name: 'Nusrat Jahan',
            phone: '01722222222',
            occupation: 'Software Engineer',
            gender: 'FEMALE',
            smoker: false,
            hasPets: false,
            sleepSchedule: 'NIGHT_OWL',
            cleanliness: 'VERY_TIDY',
            budgetMin: 8000,
            budgetMax: 15000,
            preferredAreas: ['Dhanmondi', 'Mohammadpur'],
          },
        },
      },
      include: { tenantProfile: true },
    });
    console.log(`Demo tenant created: ${tenantEmail}`);
  }

  const landlordProfile = await prisma.landlordProfile.findUnique({
    where: { userId: landlordUser.id },
  });

  if (landlordProfile) {
    const listingCount = await prisma.listing.count({
      where: { landlordId: landlordProfile.id },
    });

    if (listingCount === 0) {
      await prisma.listing.createMany({
        data: [
          {
            landlordId: landlordProfile.id,
            title: 'Cozy Private Room in Dhanmondi',
            description:
              'A well-lit private room in a 3-bedroom apartment, close to Dhanmondi Lake. Ideal for working professionals.',
            type: 'PRIVATE_ROOM',
            status: 'PUBLISHED',
            rentAmount: 12000,
            securityDeposit: 12000,
            bedrooms: 1,
            bathrooms: 1,
            maxOccupants: 1,
            addressLine: 'Road 8, Dhanmondi',
            city: 'Dhaka',
            area: 'Dhanmondi',
            latitude: 23.7461,
            longitude: 90.3742,
            amenities: ['WiFi', 'AC', 'Attached Bathroom', 'Furnished'],
            images: [],
            genderPreference: 'FEMALE',
          },
          {
            landlordId: landlordProfile.id,
            title: 'Entire Apartment in Mohammadpur',
            description:
              '2-bedroom entire apartment, newly renovated, close to main road and markets.',
            type: 'ENTIRE_PLACE',
            status: 'PUBLISHED',
            rentAmount: 22000,
            securityDeposit: 22000,
            bedrooms: 2,
            bathrooms: 2,
            maxOccupants: 4,
            addressLine: 'Shekhertek, Mohammadpur',
            city: 'Dhaka',
            area: 'Mohammadpur',
            latitude: 23.762,
            longitude: 90.3591,
            amenities: ['WiFi', 'Gas', 'Generator Backup'],
            images: [],
          },
          {
            landlordId: landlordProfile.id,
            title: 'Shared Room near Dhaka University',
            description: 'Budget-friendly shared room, perfect for students.',
            type: 'SHARED_ROOM',
            status: 'PUBLISHED',
            rentAmount: 6000,
            securityDeposit: 5000,
            bedrooms: 1,
            bathrooms: 1,
            maxOccupants: 2,
            addressLine: 'Nilkhet Road',
            city: 'Dhaka',
            area: 'Nilkhet',
            latitude: 23.7345,
            longitude: 90.3897,
            amenities: ['WiFi', 'Study Table'],
            genderPreference: 'MALE',
            images: [],
          },
        ],
      });
      console.log('Demo listings created.');
    }
  }

  console.log('Seeding complete.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
