import bcrypt from 'bcryptjs';

// Default password: classroom123
const password = process.argv[2] || 'classroom123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error generating hash:', err);
    return;
  }
  console.log('Password hash:');
  console.log(hash);
  console.log('\nUpdate the PASSWORD_HASH in your .env file with this value.');
});
