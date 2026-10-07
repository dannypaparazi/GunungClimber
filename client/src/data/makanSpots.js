// Famous makan (food) spots by region, for post-hike recommendations.
// Each spot carries lat/lng so it can also be plotted on the shared map.
const makanSpots = {
  'Peninsular Malaysia': [
    {
      id: 'jalan-alor',
      name: 'Jalan Alor',
      location: 'Kuala Lumpur',
      specialty: 'Grilled seafood, satay, char kway teow',
      description: 'A legendary night food street in the heart of KL, packed with hawker stalls and open-air seating.',
      lat: 3.1466,
      lng: 101.7080,
    },
    {
      id: 'penang-hawker',
      name: 'Gurney Drive Hawker Centre',
      location: 'George Town, Penang',
      specialty: 'Penang char kway teow, asam laksa, rojak',
      description: 'A waterfront hawker centre famous for some of the best street food in Malaysia.',
      lat: 5.4387,
      lng: 100.3092,
    },
    {
      id: 'ipoh-old-town',
      name: 'Ipoh Old Town',
      location: 'Ipoh, Perak',
      specialty: 'Ipoh white coffee, hor fun, bean sprout chicken',
      description: 'Heritage coffee shops serving Ipoh\'s signature dishes in a charming old-town setting.',
      lat: 4.5975,
      lng: 101.0901,
    },
    {
      id: 'melaka-jonker',
      name: 'Jonker Street',
      location: 'Melaka',
      specialty: 'Chicken rice ball, cendol, satay celup',
      description: 'A bustling heritage street that turns into a lively night market with Peranakan and Nyonya food.',
      lat: 2.1955,
      lng: 102.2464,
    },
  ],
  Sabah: [
    {
      id: 'kk-waterfront',
      name: 'Kota Kinabalu Night Market',
      location: 'Kota Kinabalu',
      specialty: 'Grilled fish, manok pansoh, hinava',
      description: 'A seafood-heavy night market by the waterfront, popular with hikers coming down from Mount Kinabalu.',
      lat: 5.9804,
      lng: 116.0735,
    },
  ],
  Sarawak: [
    {
      id: 'kuching-laksa',
      name: 'Kuching Sarawak Laksa Stalls',
      location: 'Kuching',
      specialty: 'Sarawak laksa, kolo mee',
      description: 'Famous for Sarawak laksa — a rich, spiced coconut-based noodle soup unique to the region.',
      lat: 1.5535,
      lng: 110.3593,
    },
  ],
  Singapore: [
    {
      id: 'maxwell-food-centre',
      name: 'Maxwell Food Centre',
      location: 'Singapore',
      specialty: 'Hainanese chicken rice, char kway teow',
      description: 'One of Singapore\'s most iconic hawker centres, home to Tian Tian Chicken Rice.',
      lat: 1.2802,
      lng: 103.8448,
    },
  ],
};

export default makanSpots;
