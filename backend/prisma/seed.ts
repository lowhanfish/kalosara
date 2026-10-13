import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
try {
  await prisma.appSetting.upsert({
    where: { key: 'site.name' },
    update: {},
    create: { key: 'site.name', value: 'Kelurahan Contoh' },
  });
} finally {
  await prisma.$disconnect();
}
