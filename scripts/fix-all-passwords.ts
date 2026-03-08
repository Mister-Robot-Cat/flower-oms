import { PrismaClient } from '../prisma-client/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function fixPasswords() {
  const users = ['admin', 'operator1', 'operator2', 'florist1', 'florist2'];
  const password = 'password123';

  console.log('Обновляем пароли для всех пользователей...\n');

  for (const username of users) {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      console.log(`❌ Пользователь ${username} не найден`);
      continue;
    }

    const newHash = await bcrypt.hash(password, 10);
    
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    console.log(`✓ Пароль обновлен для: ${username} (${user.role})`);
    
    // Проверяем
    const isValid = await bcrypt.compare(password, newHash);
    console.log(`  Проверка: ${isValid ? '✓ OK' : '❌ FAILED'}`);
  }

  console.log('\n✓ Все пароли обновлены!');
  console.log('\nВсе пользователи имеют пароль: password123');
}

fixPasswords()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
