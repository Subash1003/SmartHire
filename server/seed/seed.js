import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import Organization from '../models/Organization.js';
import User from '../models/User.js';

const SALT_ROUNDS = 12;
const DEMO_PASSWORD = 'Demo@1234';

const DEMO_ACCOUNTS = [
  { name: 'Ava Admin', email: 'admin@demo.com', role: 'admin' },
  { name: 'Riya Recruiter', email: 'recruiter@demo.com', role: 'recruiter' },
  { name: 'Ian Interviewer', email: 'interviewer@demo.com', role: 'interviewer' },
  { name: 'Cara Candidate', email: 'candidate@demo.com', role: 'candidate' },
];

async function seed() {
  await mongoose.connect(env.mongoUri);
  console.log('Connected to MongoDB for seeding');

  let organization = await Organization.findOne({ name: 'TechNova Solutions' });
  if (!organization) {
    organization = await Organization.create({
      name: 'TechNova Solutions',
      description: 'A mid-size product company building developer tools.',
      website: 'https://technova.example.com',
      industry: 'Software',
      location: 'Bengaluru, India',
      contactEmail: 'hello@technova.example.com',
    });
    console.log(`Created organization: ${organization.name} (${organization._id})`);
  } else {
    console.log(`Organization already exists: ${organization.name} (${organization._id})`);
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);

  for (const account of DEMO_ACCOUNTS) {
    const existing = await User.findOne({ email: account.email });
    if (existing) {
      console.log(`Demo user already exists: ${account.email}`);
      continue;
    }

    await User.create({
      organizationId: organization._id,
      name: account.name,
      email: account.email,
      passwordHash,
      role: account.role,
      isEmailVerified: true,
    });
    console.log(`Created demo user: ${account.email} (${account.role})`);
  }

  console.log('\nDemo accounts (development only):');
  for (const account of DEMO_ACCOUNTS) {
    console.log(`  ${account.role.padEnd(12)} ${account.email}  password: ${DEMO_PASSWORD}`);
  }

  await mongoose.disconnect();
  console.log('\nSeeding complete.');
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
