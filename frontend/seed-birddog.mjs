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

// Sign in anonymously to get Firestore access
const cred = await signInAnonymously(auth)
const uid = cred.user.uid
console.log('Signed in as:', uid)

// Create a user profile so Firestore rules are satisfied
await setDoc(doc(db, 'users', uid), {
  displayName: 'Seed Bot',
  email: 'seed@dispodojo.com',
  role: 'member',
  createdAt: Timestamp.now(),
})
console.log('User profile created for:', uid)

const now = Timestamp.now()

// Use stable seed IDs so posts are tied to "fake" user accounts
// but the userId on each post is just for display — the auth UID writes them
const birdDogPosts = [
  {
    userId: 'seed-birddog-1',
    authorName: 'Marcus Johnson',
    postType: 'bird_dog',
    title: 'Full-time door-knocker covering all of Fort Worth',
    description: 'I knock 50+ doors a week across Fort Worth and Arlington. Specialize in pre-foreclosures and tired landlords. I verify every lead before submitting — owner contact confirmed, motivation verified. 3 years experience, 40+ qualified leads delivered.',
    area: ['Fort Worth, TX', 'Arlington, TX', 'Tarrant County'],
    methods: ['Door-Knocking', 'Skip Tracing', 'Driving for Dollars'],
    taskType: '',
    payout: '',
    urgency: '',
    deadline: '',
    availability: 'available',
    status: 'active',
    applicants: [],
    createdAt: now,
    updatedAt: now,
  },
  {
    userId: 'seed-birddog-2',
    authorName: 'Sarah Chen',
    postType: 'bird_dog',
    title: 'Experienced cold caller — Dallas & surrounding areas',
    description: 'Former real estate agent turned bird dog. I run skip-traced cold call campaigns targeting absentee owners and inherited properties. I speak English, Spanish, and Mandarin. Average 200+ calls per day with a 3% lead conversion rate.',
    area: ['Dallas, TX', 'Plano, TX', 'Richardson, TX', 'Garland, TX'],
    methods: ['Cold Calling', 'Skip Tracing', 'Referral Network'],
    taskType: '',
    payout: '',
    urgency: '',
    deadline: '',
    availability: 'available',
    status: 'active',
    applicants: [],
    createdAt: new Timestamp(now.seconds - 86400, 0),
    updatedAt: new Timestamp(now.seconds - 86400, 0),
  },
  {
    userId: 'seed-birddog-3',
    authorName: 'Dwayne Mitchell',
    postType: 'bird_dog',
    title: 'Driving for dollars specialist — South Dallas & Oak Cliff',
    description: 'I drive 6 routes a week through South Dallas, Oak Cliff, and Pleasant Grove. GPS-tracked routes with photos of every property. I focus on boarded-up properties, code violations, and overgrown yards. Can also verify occupancy status.',
    area: ['South Dallas, TX', 'Oak Cliff, TX', 'Pleasant Grove, TX'],
    methods: ['Driving for Dollars', 'Door-Knocking'],
    taskType: '',
    payout: '',
    urgency: '',
    deadline: '',
    availability: 'available',
    status: 'active',
    applicants: [],
    createdAt: new Timestamp(now.seconds - 172800, 0),
    updatedAt: new Timestamp(now.seconds - 172800, 0),
  },
  {
    userId: 'seed-birddog-4',
    authorName: 'Keisha Williams',
    postType: 'bird_dog',
    title: 'Houston metro area — referral network & community connections',
    description: 'Born and raised in 3rd Ward Houston. Deep community ties across Houston, Pasadena, and Missouri City. I find off-market deals through church networks, barbershops, and neighborhood connections that never hit any list. Quality over quantity.',
    area: ['Houston, TX', 'Pasadena, TX', 'Missouri City, TX', 'Sugar Land, TX'],
    methods: ['Referral Network', 'Door-Knocking', 'Cold Calling'],
    taskType: '',
    payout: '',
    urgency: '',
    deadline: '',
    availability: 'available',
    status: 'active',
    applicants: [],
    createdAt: new Timestamp(now.seconds - 259200, 0),
    updatedAt: new Timestamp(now.seconds - 259200, 0),
  },
]

const jobPosts = [
  {
    userId: 'seed-investor-1',
    authorName: 'Brandon Rivera',
    postType: 'job',
    title: 'Need bird dog for driving routes in South Dallas',
    description: 'Looking for someone to drive 3 specific routes weekly in South Dallas and Pleasant Grove. Need photos of distressed properties, code violation addresses, and any properties with overgrown yards or boarded windows. Must be consistent — I need weekly reports every Friday.',
    area: ['South Dallas, TX', 'Pleasant Grove, TX'],
    methods: [],
    taskType: 'Driving for Dollars',
    payout: '$500 per qualified lead',
    urgency: 'High',
    deadline: '2026-03-15',
    availability: '',
    status: 'active',
    applicants: [],
    createdAt: now,
    updatedAt: now,
  },
  {
    userId: 'seed-investor-2',
    authorName: 'Amanda Torres',
    postType: 'job',
    title: 'Door-knocker needed for pre-foreclosure list in Fort Worth',
    description: 'I have a list of 200 pre-foreclosure properties in Fort Worth that need to be door-knocked. Looking for someone who can verify occupancy, gauge motivation, and get a conversation started. If the owner is interested, I close the deal. You get paid on every qualified lead.',
    area: ['Fort Worth, TX', 'Tarrant County'],
    methods: [],
    taskType: 'Door-Knocking',
    payout: '$750 per closed deal',
    urgency: 'Medium',
    deadline: '2026-04-01',
    availability: '',
    status: 'active',
    applicants: [],
    createdAt: new Timestamp(now.seconds - 43200, 0),
    updatedAt: new Timestamp(now.seconds - 43200, 0),
  },
  {
    userId: 'seed-investor-3',
    authorName: 'James Whitfield',
    postType: 'job',
    title: 'Cold caller for absentee owner campaign — DFW metro',
    description: 'Running a wholesale operation across the entire DFW metro. Need an experienced cold caller to work my skip-traced list of 5,000 absentee owners. Looking for someone who can handle objections and set appointments. Must be available for at least 4 hours/day, Mon-Fri.',
    area: ['Dallas, TX', 'Fort Worth, TX', 'DFW Metro'],
    methods: [],
    taskType: 'Cold Calling',
    payout: '$1,000 per deal + $50 per qualified lead',
    urgency: 'ASAP',
    deadline: '',
    availability: '',
    status: 'active',
    applicants: [],
    createdAt: new Timestamp(now.seconds - 7200, 0),
    updatedAt: new Timestamp(now.seconds - 7200, 0),
  },
  {
    userId: 'seed-investor-4',
    authorName: 'Lisa Park',
    postType: 'job',
    title: 'General scouting — Houston Heights & Montrose neighborhoods',
    description: 'Looking for someone local to Houston Heights and Montrose to scout properties that look like they need work. Vacant lots, fixer-uppers, anything that looks like it has been sitting. No lists provided — I want boots on the ground finding deals the data companies miss.',
    area: ['Houston Heights, TX', 'Montrose, TX', 'Houston, TX'],
    methods: [],
    taskType: 'General Scouting',
    payout: '$400 per qualified lead',
    urgency: 'Low',
    deadline: '',
    availability: '',
    status: 'active',
    applicants: [],
    createdAt: new Timestamp(now.seconds - 345600, 0),
    updatedAt: new Timestamp(now.seconds - 345600, 0),
  },
]

console.log('Seeding bird dog posts...')
for (const post of birdDogPosts) {
  const ref = await addDoc(collection(db, 'bird_dog_posts'), post)
  console.log(`  ✓ Bird Dog: "${post.title}" (${ref.id})`)
}

console.log('\nSeeding job posts...')
for (const post of jobPosts) {
  const ref = await addDoc(collection(db, 'bird_dog_posts'), post)
  console.log(`  ✓ Job: "${post.title}" (${ref.id})`)
}

console.log('\nDone! 4 bird dog posts + 4 job posts seeded.')
process.exit(0)
