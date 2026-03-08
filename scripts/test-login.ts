import { PrismaClient } from '../prisma-client/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testLogin() {
  const username = 'admin';
  const password = 'password123';

  console.log(`Проверяем вход для: ${username}`);
  
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    console.log('❌ Пользователь не найден в базе данных');
    return;
  }

  console.log('✓ Пользователь найден:', {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
  });

  const isValid = await bcrypt.compare(password, user.passwordHash);
  
  if (isValid) {
    console.log('✓ Пароль правильный!');
  } else {
    console.log('❌ Пароль неправильный!');
    console.log('Хеш в БД:', user.passwordHash);
    
    // Создадим новый хеш для проверки
    const newHash = await bcrypt.hash(password, 10);
    console.log('Новый хеш:', newHash);
    
    // Обновим пользователя с правильным хешем
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });
    console.log('✓ Пароль обновлен!');
  }
}

testLogin()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
