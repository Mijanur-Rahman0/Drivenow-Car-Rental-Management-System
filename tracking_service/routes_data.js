/**
 * Authentic highway routes in Bangladesh with GPS coordinates [longitude, latitude] (GeoJSON format)
 * Note: longitude is index 0, latitude is index 1.
 */

const ROUTES = {
  'Dhaka → Chittagong': [
    { name: 'Dhaka - Motijheel Starting Point', coords: [90.4125, 23.8103], speed: 30 },
    { name: 'Sayedabad Bus Terminal', coords: [90.4312, 23.7121], speed: 35 },
    { name: 'Kanchpur Bridge (N1 Highway)', coords: [90.5187, 23.7042], speed: 65 },
    { name: 'Meghna Bridge Crossing', coords: [90.6274, 23.6053], speed: 70 },
    { name: 'Daudkandi Toll Plaza, Cumilla', coords: [90.7208, 23.5358], speed: 75 },
    { name: 'Chandina Highway, Cumilla', coords: [90.9688, 23.4862], speed: 80 },
    { name: 'Cumilla Bypass Paduar Bazar', coords: [91.1809, 23.4607], speed: 60 },
    { name: 'Chauddagram Highway Crossing', coords: [91.3175, 23.2201], speed: 85 },
    { name: 'Feni Bypass Highway', coords: [91.4026, 23.0159], speed: 80 },
    { name: 'Mirsharai Industrial Zone', coords: [91.5739, 22.7725], speed: 75 },
    { name: 'Sitakunda Highway', coords: [91.6582, 22.6206], speed: 70 },
    { name: 'Bhatiari Naval Academy Road', coords: [91.7335, 22.4431], speed: 50 },
    { name: 'Chittagong GEC Circle / Agrabad', coords: [91.8155, 22.3569], speed: 40 }
  ],
  'Dhaka → Sylhet': [
    { name: 'Dhaka Mohakhali Hub', coords: [90.4007, 23.7776], speed: 35 },
    { name: 'Kanchpur Interchange', coords: [90.5187, 23.7042], speed: 60 },
    { name: 'Narsingdi Velanagar Bypass', coords: [90.7186, 23.9214], speed: 75 },
    { name: 'Bhairab Bridge Over Meghna', coords: [91.0028, 24.0483], speed: 65 },
    { name: 'Brahmanbaria Ashuganj Junction', coords: [91.0189, 24.0255], speed: 70 },
    { name: 'Shahjibazar, Habiganj', coords: [91.4053, 24.3168], speed: 80 },
    { name: 'Shayestaganj Toll Plaza', coords: [91.4651, 24.2691], speed: 80 },
    { name: 'Sreemangal Tea Resort Road', coords: [91.7314, 24.3065], speed: 65 },
    { name: 'Moulvibazar Town Bypass', coords: [91.7709, 24.4829], speed: 70 },
    { name: 'Sherpur Bridge, Osmani Nagar', coords: [91.8021, 24.6401], speed: 75 },
    { name: 'Sylhet Humayun Rashid Square', coords: [91.8687, 24.8949], speed: 45 }
  ],
  'Dhaka → Khulna': [
    { name: 'Dhaka Gabtoli / Babubazar', coords: [90.3542, 23.7806], speed: 35 },
    { name: 'Dhaka-Mawa Expressway', coords: [90.3802, 23.6301], speed: 85 },
    { name: 'Padma Bridge North Toll Plaza', coords: [90.2667, 23.4776], speed: 90 },
    { name: 'Padma Bridge South Pier (Janjira)', coords: [90.2205, 23.4285], speed: 85 },
    { name: 'Bhanga Interchange (Expressway Hub)', coords: [89.9882, 23.3831], speed: 80 },
    { name: 'Gopalganj Sadar Bypass', coords: [89.8272, 23.0051], speed: 75 },
    { name: 'Fakirhat Highway, Bagerhat', coords: [89.7042, 22.7791], speed: 70 },
    { name: 'Rupsha Bridge, Khulna', coords: [89.5851, 22.7912], speed: 60 },
    { name: 'Khulna Shibbari Circle / Royal Crossing', coords: [89.5403, 22.8456], speed: 40 }
  ],
  'Dhaka → Noakhali': [
    { name: 'Dhaka Jatrabari Flyover', coords: [90.4363, 23.7089], speed: 40 },
    { name: 'Kanchpur N1 Link', coords: [90.5187, 23.7042], speed: 65 },
    { name: 'Daudkandi, Cumilla', coords: [90.7208, 23.5358], speed: 75 },
    { name: 'Paduar Bazar Junction', coords: [91.1809, 23.4607], speed: 70 },
    { name: 'Laksam Highway Junction', coords: [91.1912, 23.2415], speed: 70 },
    { name: 'Sonaimuri High School Road', coords: [91.1091, 23.0384], speed: 60 },
    { name: 'Begumganj Chowmuhani Circle', coords: [91.1011, 22.9238], speed: 50 },
    { name: 'Maijdee Court Town, Noakhali', coords: [91.0975, 22.8696], speed: 40 }
  ]
};

// Default fallback circuit in Dhaka city
const DHAKA_CITY_ROUTE = [
  { name: 'Gulshan 2 Circle', coords: [90.4152, 23.7937], speed: 30 },
  { name: 'Banani 11 Shopping Ave', coords: [90.4048, 23.7935], speed: 35 },
  { name: 'Mohakhali Flyover', coords: [90.4007, 23.7776], speed: 50 },
  { name: 'Tejgaon Industrial Area', coords: [90.3986, 23.7654], speed: 40 },
  { name: 'Bijoy Sarani Link', coords: [90.3872, 23.7621], speed: 45 },
  { name: 'Dhanmondi 27 / Mirpur Road', coords: [90.3742, 23.7541], speed: 35 },
  { name: 'Panthapath Green Road', coords: [90.3887, 23.7511], speed: 35 },
  { name: 'Shahbagh Crossing', coords: [90.3958, 23.7381], speed: 30 },
  { name: 'Dhaka University Curzon Hall', coords: [90.4055, 23.7275], speed: 30 },
  { name: 'Motijheel Commercial Area', coords: [90.4184, 23.7331], speed: 35 }
];

function getRouteForBooking(routeKey) {
  if (!routeKey) return DHAKA_CITY_ROUTE;
  const normalized = routeKey.replace('->', '→').trim();
  return ROUTES[normalized] || DHAKA_CITY_ROUTE;
}

module.exports = {
  ROUTES,
  DHAKA_CITY_ROUTE,
  getRouteForBooking
};
