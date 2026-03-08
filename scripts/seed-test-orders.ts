import { PrismaClient, OrderType, OrderStatus } from '../prisma-client/client';

const prisma = new PrismaClient();

async function seedOrders() {
  console.log('Создаем тестовые заказы...\n');

  // Получаем пользователей
  const admin = await prisma.user.findUnique({ where: { username: 'admin' } });
  const operator1 = await prisma.user.findUnique({ where: { username: 'operator1' } });
  const florist1 = await prisma.user.findUnique({ where: { username: 'florist1' } });

  if (!admin || !operator1 || !florist1) {
    console.log('❌ Пользователи не найдены. Сначала запустите seed-users.ts');
    return;
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);

  // Создаем заказы с разными статусами
  const orders = [
    {
      customerFullName: 'Ayşe Məmmədova',
      customerPhone: '+994501234567',
      deliveryDate: tomorrow,
      deliveryTime: '14:00',
      orderType: OrderType.DELIVERY,
      deliveryAddress: 'Bakı, Nəsimi rayonu, 28 May küçəsi 12',
      notes: 'Zəng edin çatdırmazdan əvvəl',
      amount: 150.00,
      status: OrderStatus.NEW,
      createdById: operator1.id,
    },
    {
      customerFullName: 'Elvin Həsənov',
      customerPhone: '+994502345678',
      deliveryDate: tomorrow,
      deliveryTime: '16:00',
      orderType: OrderType.PICKUP,
      deliveryAddress: null,
      notes: 'Mağazadan götürəcək',
      amount: 85.50,
      status: OrderStatus.IN_PROGRESS,
      createdById: operator1.id,
      assignedToId: florist1.id,
    },
    {
      customerFullName: 'Leyla İbrahimova',
      customerPhone: '+994503456789',
      deliveryDate: tomorrow,
      deliveryTime: '10:00',
      orderType: OrderType.DELIVERY,
      deliveryAddress: 'Bakı, Yasamal rayonu, Azadlıq prospekti 45',
      notes: 'Tələsmirəm',
      amount: 200.00,
      status: OrderStatus.READY,
      createdById: operator1.id,
      assignedToId: florist1.id,
      preparedById: florist1.id,
    },
    {
      customerFullName: 'Rəşad Quliyev',
      customerPhone: '+994504567890',
      deliveryDate: dayAfter,
      deliveryTime: '12:00',
      orderType: OrderType.DELIVERY,
      deliveryAddress: 'Bakı, Səbail rayonu, Nizami küçəsi 78',
      notes: 'Ad günü üçün',
      amount: 175.00,
      status: OrderStatus.READY,
      createdById: operator1.id,
      assignedToId: florist1.id,
      preparedById: florist1.id,
    },
    {
      customerFullName: 'Günel Əliyeva',
      customerPhone: '+994505678901',
      deliveryDate: tomorrow,
      deliveryTime: '18:00',
      orderType: OrderType.PICKUP,
      deliveryAddress: null,
      notes: 'Axşam gələcək',
      amount: 120.00,
      status: OrderStatus.PICKUP,
      createdById: operator1.id,
      assignedToId: florist1.id,
      preparedById: florist1.id,
    },
    {
      customerFullName: 'Kamran Məmmədov',
      customerPhone: '+994506789012',
      deliveryDate: tomorrow,
      deliveryTime: '15:00',
      orderType: OrderType.DELIVERY,
      deliveryAddress: 'Bakı, Xətai rayonu, Koroğlu küçəsi 23',
      notes: 'Kuryer zəng etsin',
      amount: 95.00,
      status: OrderStatus.OUT_FOR_DELIVERY,
      createdById: operator1.id,
      assignedToId: florist1.id,
      preparedById: florist1.id,
    },
  ];

  for (const orderData of orders) {
    const order = await prisma.order.create({
      data: orderData,
    });

    // Создаем событие для каждого заказа
    await prisma.orderEvent.create({
      data: {
        orderId: order.id,
        userId: orderData.createdById,
        type: 'ORDER_CREATED',
        message: 'Sifariş yaradıldı',
      },
    });

    console.log(`✓ Создан заказ: ${order.customerFullName} - ${order.status}`);
  }

  console.log('\n✓ Все тестовые заказы созданы!');
  console.log('\nСтатистика:');
  console.log('- NEW: 1 заказ');
  console.log('- IN_PROGRESS: 1 заказ');
  console.log('- READY: 2 заказа (отобразятся в колл-центре)');
  console.log('- PICKUP: 1 заказ');
  console.log('- OUT_FOR_DELIVERY: 1 заказ');
}

seedOrders()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
