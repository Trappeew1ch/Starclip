import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const clips = await prisma.clip.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10
    });
    console.log(clips.map(c => c.videoUrl));
}

main().catch(console.error).finally(() => prisma.$disconnect());
