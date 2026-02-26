import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, setDoc, doc, Timestamp } from 'firebase/firestore'
import { getAuth, signInAnonymously } from 'firebase/auth'

const app = initializeApp({
  apiKey: 'AIzaSyDZs8UcJ584jPVSwCzeKy70_VsjWQ7wPa0',
  authDomain: 'dispo-dojo-site.firebaseapp.com',
  projectId: 'dispo-dojo-site',
  storageBucket: 'dispo-dojo-site.firebasestorage.app',
  messagingSenderId: '853175549252',
  appId: '1:853175549252:web:72c88c5e66cec13ea1ab11',
})

const db = getFirestore(app)
const auth = getAuth(app)

const cred = await signInAnonymously(auth)
const uid = cred.user.uid
console.log('Signed in as:', uid)

// Create a user profile so Firestore rules are satisfied
try {
  await setDoc(doc(db, 'users', uid), {
    displayName: 'Seed Bot',
    email: 'seed@dispodojo.com',
    role: 'member',
    createdAt: Timestamp.now(),
  })
  console.log('User profile created for:', uid)
} catch (e) {
  console.error('Failed to create user profile:', e.code, e.message)
  console.log('Continuing anyway — profile may already exist...')
}

const now = Timestamp.now()
const ago = (seconds) => new Timestamp(now.seconds - seconds, 0)

// ─── Service Posts (Boots Operators offering services) ─────────────────────

const servicePosts = [
  {
    userId: 'seed-operator-1',
    userName: 'Marcus Johnson',
    userAvatar: null,
    type: 'service',
    title: 'Full-service property inspector — Phoenix metro',
    description: 'Licensed home inspector with 5 years experience. I do photos, video walkthroughs, lockbox coordination, and occupancy checks. Own my own DSLR and drone for aerial shots. Same-day turnaround for standard photo packages. Can cover the entire Phoenix metro within 24 hours of assignment.',
    taskTypes: ['photos', 'walkthrough', 'lockbox', 'occupant'],
    customTaskType: '',
    serviceArea: ['Phoenix, AZ', 'Scottsdale, AZ', 'Tempe, AZ', 'Mesa, AZ'],
    availability: 'available',
    urgency: 'normal',
    status: 'active',
    applicantCount: 0,
    acceptedUserId: null,
    createdAt: ago(3600),
    updatedAt: ago(3600),
  },
  {
    userId: 'seed-operator-2',
    userName: 'Sarah Chen',
    userAvatar: null,
    type: 'service',
    title: 'Sign placement & HOA doc runner — East Valley',
    description: 'I handle sign placements, bandit sign runs, and HOA document pickups across the East Valley. Have a truck with sign installation equipment. Can also do occupancy checks while I\'m on-site. Usually available Mon-Sat, same-day for urgent requests.',
    taskTypes: ['sign', 'hoa', 'occupant'],
    customTaskType: '',
    serviceArea: ['Mesa, AZ', 'Gilbert, AZ', 'Chandler, AZ', 'Queen Creek, AZ'],
    availability: 'available',
    urgency: 'normal',
    status: 'active',
    applicantCount: 0,
    acceptedUserId: null,
    createdAt: ago(86400),
    updatedAt: ago(86400),
  },
  {
    userId: 'seed-operator-3',
    userName: 'Dwayne Mitchell',
    userAvatar: null,
    type: 'service',
    title: 'Professional property photographer — DFW Metro',
    description: 'Real estate photographer with a portfolio of 500+ properties shot. I bring my own lighting kit, wide-angle lens, and can deliver edited photos within 4 hours. Also do video walkthroughs with narration. Drone-certified for aerials. Weekdays only.',
    taskTypes: ['photos', 'walkthrough'],
    customTaskType: '',
    serviceArea: ['Dallas, TX', 'Fort Worth, TX', 'Arlington, TX', 'Plano, TX'],
    availability: 'available',
    urgency: 'normal',
    status: 'active',
    applicantCount: 0,
    acceptedUserId: null,
    createdAt: ago(172800),
    updatedAt: ago(172800),
  },
  {
    userId: 'seed-operator-4',
    userName: 'Keisha Williams',
    userAvatar: null,
    type: 'service',
    title: 'Boots on the ground — Houston area',
    description: 'Born and raised in Houston. I can check on any property in the metro — occupancy status, exterior photos, neighbor intel, HOA docs from the management office. I have contacts at multiple HOA management companies so I can usually get docs same-day.',
    taskTypes: ['occupant', 'photos', 'hoa'],
    customTaskType: '',
    serviceArea: ['Houston, TX', 'Pasadena, TX', 'Missouri City, TX', 'Sugar Land, TX'],
    availability: 'available',
    urgency: 'normal',
    status: 'active',
    applicantCount: 0,
    acceptedUserId: null,
    createdAt: ago(259200),
    updatedAt: ago(259200),
  },
  {
    userId: 'seed-operator-5',
    userName: 'Tony Ramirez',
    userAvatar: null,
    type: 'service',
    title: 'Lockbox & access coordinator — West Valley AZ',
    description: 'Former locksmith, now doing full-time lockbox installations and property access coordination for investors. I carry Supra, SentriLock, and combination lockboxes. Can also do basic property securing (board-ups, lock changes). Available 7 days a week for emergencies.',
    taskTypes: ['lockbox', 'sign', 'photos'],
    customTaskType: '',
    serviceArea: ['Glendale, AZ', 'Peoria, AZ', 'Goodyear, AZ', 'Surprise, AZ'],
    availability: 'available',
    urgency: 'normal',
    status: 'active',
    applicantCount: 0,
    acceptedUserId: null,
    createdAt: ago(345600),
    updatedAt: ago(345600),
  },
  {
    userId: 'seed-operator-6',
    userName: 'Jessica Park',
    userAvatar: null,
    type: 'service',
    title: 'Video walkthroughs & condition reports — San Antonio',
    description: 'I create detailed video walkthroughs with written condition reports. Every video includes room-by-room narration, noting damage, repairs needed, and estimated costs. Reports are sent as a PDF with timestamps and photo annotations. Great for out-of-state investors.',
    taskTypes: ['walkthrough', 'photos'],
    customTaskType: '',
    serviceArea: ['San Antonio, TX', 'New Braunfels, TX', 'Seguin, TX'],
    availability: 'unavailable',
    urgency: 'normal',
    status: 'active',
    applicantCount: 0,
    acceptedUserId: null,
    createdAt: ago(432000),
    updatedAt: ago(86400),
  },
]

// ─── Job Posts (Investors looking for boots operators) ──────────────────────

const jobPosts = [
  {
    userId: 'seed-investor-1',
    userName: 'Brandon Rivera',
    userAvatar: null,
    type: 'job',
    title: 'Need photos & walkthrough of duplex in Mesa, AZ',
    description: 'Under contract on a duplex at 4521 E Main St, Mesa. Need someone to do a full photo set (exterior + both units interior) and a 5-minute video walkthrough. Property is vacant — lockbox code will be provided. Need this done by end of week.',
    taskTypes: ['photos', 'walkthrough'],
    customTaskType: '',
    location: '4521 E Main St, Mesa, AZ 85205',
    serviceArea: [],
    availability: 'normal',
    urgency: 'urgent',
    status: 'active',
    applicantCount: 3,
    acceptedUserId: null,
    createdAt: ago(7200),
    updatedAt: ago(7200),
  },
  {
    userId: 'seed-investor-2',
    userName: 'Amanda Torres',
    userAvatar: null,
    type: 'job',
    title: 'Occupancy check on 5 properties — Fort Worth',
    description: 'I have 5 properties under review in the Stop Six and Polytechnic Heights neighborhoods. Need someone to drive by each one and confirm occupancy status — are there cars in the driveway, lights on, mail piling up, yard maintained? Quick drive-bys with photos. List of addresses will be shared once accepted.',
    taskTypes: ['occupant', 'photos'],
    customTaskType: '',
    location: 'Fort Worth, TX — Stop Six & Polytechnic Heights',
    serviceArea: [],
    availability: 'normal',
    urgency: 'normal',
    status: 'active',
    applicantCount: 1,
    acceptedUserId: null,
    createdAt: ago(43200),
    updatedAt: ago(43200),
  },
  {
    userId: 'seed-investor-3',
    userName: 'James Whitfield',
    userAvatar: null,
    type: 'job',
    title: 'URGENT: Lockbox install on vacant property — Glendale, AZ',
    description: 'Just got a property under contract and need a lockbox installed ASAP so my contractors can access it. Property is at 7834 W Bethany Home Rd, Glendale. Vacant, no utilities. I\'ll provide the lockbox — just need someone to install it today or tomorrow. Will pay extra for same-day.',
    taskTypes: ['lockbox'],
    customTaskType: '',
    location: '7834 W Bethany Home Rd, Glendale, AZ 85303',
    serviceArea: [],
    availability: 'normal',
    urgency: 'urgent',
    status: 'active',
    applicantCount: 2,
    acceptedUserId: null,
    createdAt: ago(1800),
    updatedAt: ago(1800),
  },
  {
    userId: 'seed-investor-4',
    userName: 'Lisa Park',
    userAvatar: null,
    type: 'job',
    title: 'HOA docs needed for condo in Scottsdale',
    description: 'Closing on a condo at The Palms at Scottsdale. Need someone to pick up the HOA docs package from the management office — financials, CC&Rs, meeting minutes, and any pending assessments. Management company is FirstService Residential. They said docs are ready for pickup at their Scottsdale office.',
    taskTypes: ['hoa'],
    customTaskType: '',
    location: 'Scottsdale, AZ — The Palms at Scottsdale',
    serviceArea: [],
    availability: 'normal',
    urgency: 'normal',
    status: 'active',
    applicantCount: 0,
    acceptedUserId: null,
    createdAt: ago(172800),
    updatedAt: ago(172800),
  },
  {
    userId: 'seed-investor-5',
    userName: 'Carlos Mendez',
    userAvatar: null,
    type: 'job',
    title: 'Sign placement — 10 bandit signs across Phoenix',
    description: 'Need someone to place 10 "We Buy Houses" bandit signs at high-traffic intersections across central Phoenix. Signs will be provided — corrugated with metal stakes. Specific intersections mapped out. Need done on a Saturday morning before 8am. Photos of each placement required.',
    taskTypes: ['sign'],
    customTaskType: '',
    location: 'Phoenix, AZ — Central Phoenix intersections',
    serviceArea: [],
    availability: 'normal',
    urgency: 'normal',
    status: 'active',
    applicantCount: 1,
    acceptedUserId: null,
    createdAt: ago(259200),
    updatedAt: ago(259200),
  },
  {
    userId: 'seed-investor-1',
    userName: 'Brandon Rivera',
    userAvatar: null,
    type: 'job',
    title: 'Full property inspection — flip candidate in Tempe',
    description: 'Looking at a potential flip near ASU campus. Need a thorough walkthrough with detailed condition notes — roof, HVAC, plumbing, electrical, foundation. Not a licensed inspection, just a knowledgeable set of eyes. Take photos of every room, crawl space, attic, and any visible damage. Budget is negotiable for a thorough job.',
    taskTypes: ['photos', 'walkthrough', 'occupant'],
    customTaskType: '',
    location: '1245 S Rural Rd, Tempe, AZ 85281',
    serviceArea: [],
    availability: 'normal',
    urgency: 'normal',
    status: 'active',
    applicantCount: 4,
    acceptedUserId: null,
    createdAt: ago(518400),
    updatedAt: ago(518400),
  },
]

// ─── Applications (boots operators applying to jobs) ───────────────────────

const applications = [
  {
    postId: null, // Will be filled with actual job post IDs after seeding
    applicantId: 'seed-operator-1',
    status: 'pending',
    message: 'I can get this done today. I have my camera gear ready and I\'m 10 minutes from Mesa. Happy to do same-day delivery on the photos and video.',
    createdAt: ago(3600),
  },
  {
    postId: null,
    applicantId: 'seed-operator-5',
    status: 'pending',
    message: 'Lockbox installs are my specialty — former locksmith. I can be there within 2 hours. I carry Supra, SentriLock, and combo boxes.',
    createdAt: ago(900),
  },
  {
    postId: null,
    applicantId: 'seed-operator-2',
    status: 'pending',
    message: 'I\'m in the East Valley and can swing by the management office tomorrow morning. I\'ve dealt with FirstService before — they\'re usually pretty quick.',
    createdAt: ago(86400),
  },
]

// ─── Reviews ───────────────────────────────────────────────────────────────

const reviews = [
  {
    postId: 'seed-completed-job-1',
    reviewerId: 'seed-investor-2',
    reviewerName: 'Amanda Torres',
    revieweeId: 'seed-operator-1',
    rating: 5,
    comment: 'Marcus was incredible — showed up early, photos were professional quality, and he even pointed out some foundation issues I would have missed. Will absolutely use again.',
    createdAt: ago(604800),
  },
  {
    postId: 'seed-completed-job-2',
    reviewerId: 'seed-investor-3',
    reviewerName: 'James Whitfield',
    revieweeId: 'seed-operator-5',
    rating: 4,
    comment: 'Tony got the lockbox installed same-day as requested. Professional and quick. Only knocked off a star because he didn\'t send the confirmation photo until the next morning.',
    createdAt: ago(432000),
  },
  {
    postId: 'seed-completed-job-3',
    reviewerId: 'seed-investor-1',
    reviewerName: 'Brandon Rivera',
    revieweeId: 'seed-operator-3',
    rating: 5,
    comment: 'Dwayne\'s photos looked like they came from a professional listing agent. Video walkthrough was detailed and narrated perfectly. My out-of-state buyers loved it.',
    createdAt: ago(864000),
  },
  {
    postId: 'seed-completed-job-4',
    reviewerId: 'seed-operator-4',
    reviewerName: 'Keisha Williams',
    revieweeId: 'seed-investor-4',
    rating: 5,
    comment: 'Lisa was clear with instructions, paid on time, and very respectful. Great investor to work with.',
    createdAt: ago(950400),
  },
]

// ─── Seed everything ───────────────────────────────────────────────────────

console.log('Seeding boots service posts...')
for (const post of servicePosts) {
  const ref = await addDoc(collection(db, 'boots_posts'), post)
  console.log(`  ✓ Service: "${post.title}" (${ref.id})`)
}

console.log('\nSeeding boots job posts...')
const jobRefs = []
for (const post of jobPosts) {
  const ref = await addDoc(collection(db, 'boots_posts'), post)
  jobRefs.push(ref.id)
  console.log(`  ✓ Job: "${post.title}" (${ref.id})`)
}

console.log('\nSeeding applications...')
// Assign applications to specific jobs
const appAssignments = [
  { appIndex: 0, jobIndex: 0 }, // Marcus applies to Mesa duplex
  { appIndex: 1, jobIndex: 2 }, // Tony applies to lockbox job
  { appIndex: 2, jobIndex: 3 }, // Sarah applies to HOA docs
]
for (const { appIndex, jobIndex } of appAssignments) {
  const app = { ...applications[appIndex], postId: jobRefs[jobIndex] }
  const ref = await addDoc(collection(db, 'boots_applications'), app)
  console.log(`  ✓ Application: operator ${app.applicantId} → job ${jobRefs[jobIndex]} (${ref.id})`)
}

console.log('\nSeeding reviews...')
for (const review of reviews) {
  const ref = await addDoc(collection(db, 'boots_reviews'), review)
  console.log(`  ✓ Review: ${review.reviewerName} → ${review.revieweeId} (${ref.id})`)
}

console.log('\n✅ Done! Seeded:')
console.log(`   ${servicePosts.length} service posts`)
console.log(`   ${jobPosts.length} job posts`)
console.log(`   ${appAssignments.length} applications`)
console.log(`   ${reviews.length} reviews`)
process.exit(0)
