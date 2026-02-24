import { prisma } from './index.js';
// Seed initial data
async function seed() {
    console.log('🌱 Seeding database...');
    // Create sample offers
    const offers = [
        {
            id: 'exile1',
            name: 'Exile',
            title: 'Смешные моменты и прожарка',
            type: 'YOUTUBER',
            imageUrl: 'https://i.imgur.com/K1T7lY8.jpeg',
            avatarUrl: 'https://i.imgur.com/K1T7lY8.jpeg',
            totalBudget: 1500000,
            cpmRate: 500,
            language: 'Russian',
            platforms: JSON.stringify(['youtube', 'tiktok', 'instagram']),
            description: 'Делайте нарезки с последних видео Эксайла. Нужно выделить самые смешные моменты, реакции и взаимодействия с командой.',
            requirements: JSON.stringify([
                'Смех: самые разрывные моменты',
                'Эмоции: испуг, удивление, радость',
                'Монтаж: динамичный, с субтитрами',
                'Хук: цепляющее начало (первые 3 сек)'
            ]),
            assetsLink: 'https://drive.google.com/example',
            daysLeft: 12,
            paidOut: 381000
        },
        {
            id: 'wylsacom1',
            name: 'Wylsacom',
            title: 'Обзор нового iPhone 16 Pro Max',
            type: 'YOUTUBER',
            imageUrl: 'https://imgur.com/6mIWjbX.png',
            avatarUrl: 'https://imgur.com/6mIWjbX.png',
            totalBudget: 1200000,
            cpmRate: 800,
            language: 'Russian',
            platforms: JSON.stringify(['youtube', 'tiktok']),
            description: 'Создавайте короткие ролики с яркими моментами обзора iPhone 16 Pro Max.',
            requirements: JSON.stringify([
                'Фокус на функциях камеры',
                'Сравнение с конкурентами',
                'Честные впечатления'
            ]),
            daysLeft: 21,
            paidOut: 942000
        },
        {
            id: 'marmok1',
            name: 'Marmok',
            title: 'Баги, приколы и фейлы',
            type: 'YOUTUBER',
            imageUrl: 'https://imgur.com/6mIWjbX.png',
            avatarUrl: 'https://imgur.com/6mIWjbX.png',
            totalBudget: 450000,
            cpmRate: 300,
            language: 'Russian',
            platforms: JSON.stringify(['youtube', 'tiktok', 'instagram']),
            description: 'Нарезки смешных моментов из игр: баги, фейлы, приколы.',
            daysLeft: 5,
            paidOut: 427500
        },
        {
            id: 'bulkin1',
            name: 'Bulkin',
            title: 'Гонки на тачках в GTA 5',
            type: 'YOUTUBER',
            imageUrl: 'https://imgur.com/6mIWjbX.png',
            avatarUrl: 'https://imgur.com/6mIWjbX.png',
            totalBudget: 900000,
            cpmRate: 600,
            language: 'Russian',
            platforms: JSON.stringify(['youtube', 'tiktok']),
            description: 'Эпичные моменты гонок в GTA 5 с Булкиным.',
            daysLeft: 30,
            paidOut: 108000
        },
        {
            id: 'bratishkin1',
            name: 'Bratishkin',
            title: 'Смотрим видео и общаемся',
            type: 'STREAMER',
            imageUrl: 'https://imgur.com/5SyGq8g.png',
            avatarUrl: 'https://imgur.com/5SyGq8g.png',
            totalBudget: 5000000,
            cpmRate: 400,
            language: 'Russian',
            platforms: JSON.stringify(['youtube', 'tiktok', 'instagram']),
            description: 'Смешные реакции Братишкина на видео и общение с чатом.',
            requirements: JSON.stringify([
                'Реакции на контент',
                'Взаимодействие с чатом',
                'Смешные моменты'
            ]),
            daysLeft: 45,
            paidOut: 2250000
        },
        {
            id: 'evelone1',
            name: 'Evelone',
            title: 'Мафия с подписчиками',
            type: 'STREAMER',
            imageUrl: 'https://imgur.com/5SyGq8g.png',
            avatarUrl: 'https://imgur.com/5SyGq8g.png',
            totalBudget: 3000000,
            cpmRate: 350,
            language: 'Russian',
            platforms: JSON.stringify(['youtube', 'tiktok']),
            description: 'Нарезки мафии с Эвелоном и подписчиками.',
            daysLeft: 60,
            paidOut: 0
        }
    ];
    for (const offer of offers) {
        await prisma.offer.upsert({
            where: { id: offer.id },
            update: offer,
            create: offer
        });
    }
    console.log(`✅ Created ${offers.length} offers`);
    // Create a test admin user (update telegramId with your own)
    await prisma.user.upsert({
        where: { telegramId: BigInt(123456789) },
        update: { isAdmin: true },
        create: {
            telegramId: BigInt(123456789),
            username: 'admin',
            firstName: 'Admin',
            isAdmin: true,
            balance: 0
        }
    });
    console.log('✅ Created admin user (telegramId: 123456789)');
    console.log('🎉 Seeding complete!');
}
seed()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
