import { PrismaClient } from '../prisma-client/client';
import { Role } from '../prisma-client/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Начинаем создание пользователей...');

  const users = [
    {
      id: 'admin001',
      username: 'admin',
      displayName: 'Администратор',
      password: 'password123',
      role: Role.ADMIN,
    },
    {
      id: 'callcenter001',
      username: 'operator1',
      displayName: 'Оператор Анна',
      password: 'password123',
      role: Role.CALL_CENTER,
    },
    {
      id: 'callcenter002',
      username: 'operator2',
      displayName: 'Оператор Мария',
      password: 'password123',
      role: Role.CALL_CENTER,
    },
    {
      id: 'florist001',
      username: 'florist1',
      displayName: 'Флорист Елена',
      password: 'password123',
      role: Role.FLORIST,
    },
    {
      id: 'florist002',
      username: 'florist2',
      displayName: 'Флорист Ольга',
      password: 'password123',
      role: Role.FLORIST,
    },
  ];

  for (const userData of users) {
    const passwordHash = await bcrypt.hash(userData.password, 10);
    
    const user = await prisma.user.upsert({
      where: { username: userData.username },
      update: {},
      create: {
        id: userData.id,
        username: userData.username,
        displayName: userData.displayName,
        passwordHash,
        role: userData.role,
        isActive: true,
      },
    });

    console.log(`✓ Создан пользователь: ${user.username} (${user.role})`);
  }

  console.log('\nГотово! Все пользователи созданы.');
  console.log('\nДанные для входа:');
  console.log('Логин: admin, Пароль: password123 (ADMIN)');
  console.log('Логин: operator1, Пароль: password123 (CALL_CENTER)');
  console.log('Логин: operator2, Пароль: password123 (CALL_CENTER)');
  console.log('Логин: florist1, Пароль: password123 (FLORIST)');
  console.log('Логин: florist2, Пароль: password123 (FLORIST)');
}

main()
  .catch((e) => {
    console.error('Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
