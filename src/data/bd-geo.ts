/**
 * Bangladesh administrative geography: 8 divisions → 64 districts → upazilas.
 *
 * Kept as project-owned reference data rather than an npm dependency: the only
 * candidate package had no repository, no homepage and ~39 weekly downloads,
 * which is not a supply-chain risk worth taking for a platform holding
 * students' personal data. This file changes rarely and we control it.
 *
 * NOTE FOR THE TEAM: divisions and districts are authoritative. The upazila
 * lists should be checked against the official BBS / Local Government Division
 * list before go-live — a few boundary changes and renames may be missing.
 */

export type District = {
  name: string;
  upazilas: string[];
};

export type Division = {
  name: string;
  districts: District[];
};

export const DIVISIONS: Division[] = [
  {
    name: "Barishal",
    districts: [
      { name: "Barguna", upazilas: ["Amtali", "Bamna", "Barguna Sadar", "Betagi", "Patharghata", "Taltali"] },
      { name: "Barishal", upazilas: ["Agailjhara", "Babuganj", "Bakerganj", "Banaripara", "Barishal Sadar", "Gaurnadi", "Hizla", "Mehendiganj", "Muladi", "Wazirpur"] },
      { name: "Bhola", upazilas: ["Bhola Sadar", "Burhanuddin", "Char Fasson", "Daulatkhan", "Lalmohan", "Manpura", "Tazumuddin"] },
      { name: "Jhalokati", upazilas: ["Jhalokati Sadar", "Kathalia", "Nalchity", "Rajapur"] },
      { name: "Patuakhali", upazilas: ["Bauphal", "Dashmina", "Dumki", "Galachipa", "Kalapara", "Mirzaganj", "Patuakhali Sadar", "Rangabali"] },
      { name: "Pirojpur", upazilas: ["Bhandaria", "Kawkhali", "Mathbaria", "Nazirpur", "Pirojpur Sadar", "Nesarabad (Swarupkati)", "Zianagar"] },
    ],
  },
  {
    name: "Chattogram",
    districts: [
      { name: "Bandarban", upazilas: ["Alikadam", "Bandarban Sadar", "Lama", "Naikhongchhari", "Rowangchhari", "Ruma", "Thanchi"] },
      { name: "Brahmanbaria", upazilas: ["Akhaura", "Ashuganj", "Bancharampur", "Bijoynagar", "Brahmanbaria Sadar", "Kasba", "Nabinagar", "Nasirnagar", "Sarail"] },
      { name: "Chandpur", upazilas: ["Chandpur Sadar", "Faridganj", "Haimchar", "Haziganj", "Kachua", "Matlab Dakshin", "Matlab Uttar", "Shahrasti"] },
      { name: "Chattogram", upazilas: ["Anwara", "Banshkhali", "Boalkhali", "Chandanaish", "Fatikchhari", "Hathazari", "Karnaphuli", "Lohagara", "Mirsharai", "Patiya", "Rangunia", "Raozan", "Sandwip", "Satkania", "Sitakunda"] },
      { name: "Cox's Bazar", upazilas: ["Chakaria", "Cox's Bazar Sadar", "Kutubdia", "Maheshkhali", "Pekua", "Ramu", "Teknaf", "Ukhia"] },
      { name: "Cumilla", upazilas: ["Barura", "Brahmanpara", "Burichong", "Chandina", "Chauddagram", "Cumilla Adarsha Sadar", "Cumilla Sadar Dakshin", "Daudkandi", "Debidwar", "Homna", "Laksam", "Lalmai", "Meghna", "Monohorgonj", "Muradnagar", "Nangalkot", "Titas"] },
      { name: "Feni", upazilas: ["Chhagalnaiya", "Daganbhuiyan", "Feni Sadar", "Fulgazi", "Parshuram", "Sonagazi"] },
      { name: "Khagrachhari", upazilas: ["Dighinala", "Khagrachhari Sadar", "Lakshmichhari", "Mahalchhari", "Manikchhari", "Matiranga", "Panchhari", "Ramgarh"] },
      { name: "Lakshmipur", upazilas: ["Kamalnagar", "Lakshmipur Sadar", "Raipur", "Ramganj", "Ramgati"] },
      { name: "Noakhali", upazilas: ["Begumganj", "Chatkhil", "Companiganj", "Hatiya", "Kabirhat", "Noakhali Sadar", "Senbagh", "Sonaimuri", "Subarnachar"] },
      { name: "Rangamati", upazilas: ["Bagaichhari", "Barkal", "Belaichhari", "Juraichhari", "Kaptai", "Kawkhali", "Langadu", "Naniarchar", "Rajasthali", "Rangamati Sadar"] },
    ],
  },
  {
    name: "Dhaka",
    districts: [
      { name: "Dhaka", upazilas: ["Dhamrai", "Dohar", "Keraniganj", "Nawabganj", "Savar", "Dhaka Metropolitan"] },
      { name: "Faridpur", upazilas: ["Alfadanga", "Bhanga", "Boalmari", "Charbhadrasan", "Faridpur Sadar", "Madhukhali", "Nagarkanda", "Sadarpur", "Saltha"] },
      { name: "Gazipur", upazilas: ["Gazipur Sadar", "Kaliakair", "Kaliganj", "Kapasia", "Sreepur"] },
      { name: "Gopalganj", upazilas: ["Gopalganj Sadar", "Kashiani", "Kotalipara", "Muksudpur", "Tungipara"] },
      { name: "Kishoreganj", upazilas: ["Austagram", "Bajitpur", "Bhairab", "Hossainpur", "Itna", "Karimganj", "Katiadi", "Kishoreganj Sadar", "Kuliarchar", "Mithamain", "Nikli", "Pakundia", "Tarail"] },
      { name: "Madaripur", upazilas: ["Kalkini", "Madaripur Sadar", "Rajoir", "Shibchar", "Dasar"] },
      { name: "Manikganj", upazilas: ["Daulatpur", "Ghior", "Harirampur", "Manikganj Sadar", "Saturia", "Shivalaya", "Singair"] },
      { name: "Munshiganj", upazilas: ["Gazaria", "Lohajang", "Munshiganj Sadar", "Sirajdikhan", "Sreenagar", "Tongibari"] },
      { name: "Narayanganj", upazilas: ["Araihazar", "Bandar", "Narayanganj Sadar", "Rupganj", "Sonargaon"] },
      { name: "Narsingdi", upazilas: ["Belabo", "Monohardi", "Narsingdi Sadar", "Palash", "Raipura", "Shibpur"] },
      { name: "Rajbari", upazilas: ["Baliakandi", "Goalandaghat", "Kalukhali", "Pangsha", "Rajbari Sadar"] },
      { name: "Shariatpur", upazilas: ["Bhedarganj", "Damudya", "Gosairhat", "Naria", "Shariatpur Sadar", "Zanjira"] },
      { name: "Tangail", upazilas: ["Basail", "Bhuapur", "Delduar", "Dhanbari", "Ghatail", "Gopalpur", "Kalihati", "Madhupur", "Mirzapur", "Nagarpur", "Sakhipur", "Tangail Sadar"] },
    ],
  },
  {
    name: "Khulna",
    districts: [
      { name: "Bagerhat", upazilas: ["Bagerhat Sadar", "Chitalmari", "Fakirhat", "Kachua", "Mollahat", "Mongla", "Morrelganj", "Rampal", "Sarankhola"] },
      { name: "Chuadanga", upazilas: ["Alamdanga", "Chuadanga Sadar", "Damurhuda", "Jibannagar"] },
      { name: "Jashore", upazilas: ["Abhaynagar", "Bagherpara", "Chaugachha", "Jashore Sadar", "Jhikargachha", "Keshabpur", "Manirampur", "Sharsha"] },
      { name: "Jhenaidah", upazilas: ["Harinakunda", "Jhenaidah Sadar", "Kaliganj", "Kotchandpur", "Maheshpur", "Shailkupa"] },
      { name: "Khulna", upazilas: ["Batiaghata", "Dacope", "Dighalia", "Dumuria", "Koyra", "Paikgachha", "Phultala", "Rupsa", "Terokhada", "Khulna Metropolitan"] },
      { name: "Kushtia", upazilas: ["Bheramara", "Daulatpur", "Khoksa", "Kumarkhali", "Kushtia Sadar", "Mirpur"] },
      { name: "Magura", upazilas: ["Magura Sadar", "Mohammadpur", "Shalikha", "Sreepur"] },
      { name: "Meherpur", upazilas: ["Gangni", "Meherpur Sadar", "Mujibnagar"] },
      { name: "Narail", upazilas: ["Kalia", "Lohagara", "Narail Sadar"] },
      { name: "Satkhira", upazilas: ["Assasuni", "Debhata", "Kalaroa", "Kaliganj", "Satkhira Sadar", "Shyamnagar", "Tala"] },
    ],
  },
  {
    name: "Mymensingh",
    districts: [
      { name: "Jamalpur", upazilas: ["Bakshiganj", "Dewanganj", "Islampur", "Jamalpur Sadar", "Madarganj", "Melandaha", "Sarishabari"] },
      { name: "Mymensingh", upazilas: ["Bhaluka", "Dhobaura", "Fulbaria", "Gaffargaon", "Gauripur", "Haluaghat", "Ishwarganj", "Muktagachha", "Mymensingh Sadar", "Nandail", "Phulpur", "Tarakanda", "Trishal"] },
      { name: "Netrokona", upazilas: ["Atpara", "Barhatta", "Durgapur", "Kalmakanda", "Kendua", "Madan", "Mohanganj", "Netrokona Sadar", "Purbadhala"] },
      { name: "Sherpur", upazilas: ["Jhenaigati", "Nakla", "Nalitabari", "Sherpur Sadar", "Sreebardi"] },
    ],
  },
  {
    name: "Rajshahi",
    districts: [
      { name: "Bogura", upazilas: ["Adamdighi", "Bogura Sadar", "Dhunat", "Dhupchanchia", "Gabtali", "Kahaloo", "Nandigram", "Sariakandi", "Shajahanpur", "Sherpur", "Shibganj", "Sonatala"] },
      { name: "Chapainawabganj", upazilas: ["Bholahat", "Chapainawabganj Sadar", "Gomastapur", "Nachole", "Shibganj"] },
      { name: "Joypurhat", upazilas: ["Akkelpur", "Joypurhat Sadar", "Kalai", "Khetlal", "Panchbibi"] },
      { name: "Naogaon", upazilas: ["Atrai", "Badalgachhi", "Dhamoirhat", "Manda", "Mahadebpur", "Naogaon Sadar", "Niamatpur", "Patnitala", "Porsha", "Raninagar", "Sapahar"] },
      { name: "Natore", upazilas: ["Bagatipara", "Baraigram", "Gurudaspur", "Lalpur", "Naldanga", "Natore Sadar", "Singra"] },
      { name: "Pabna", upazilas: ["Atgharia", "Bera", "Bhangura", "Chatmohar", "Faridpur", "Ishwardi", "Pabna Sadar", "Santhia", "Sujanagar"] },
      { name: "Rajshahi", upazilas: ["Bagha", "Bagmara", "Charghat", "Durgapur", "Godagari", "Mohanpur", "Paba", "Puthia", "Tanore", "Rajshahi Metropolitan"] },
      { name: "Sirajganj", upazilas: ["Belkuchi", "Chauhali", "Kamarkhanda", "Kazipur", "Raiganj", "Shahjadpur", "Sirajganj Sadar", "Tarash", "Ullapara"] },
    ],
  },
  {
    name: "Rangpur",
    districts: [
      { name: "Dinajpur", upazilas: ["Birampur", "Birganj", "Biral", "Bochaganj", "Chirirbandar", "Dinajpur Sadar", "Ghoraghat", "Hakimpur", "Kaharole", "Khansama", "Nawabganj", "Parbatipur", "Phulbari"] },
      { name: "Gaibandha", upazilas: ["Fulchhari", "Gaibandha Sadar", "Gobindaganj", "Palashbari", "Sadullapur", "Saghata", "Sundarganj"] },
      { name: "Kurigram", upazilas: ["Bhurungamari", "Char Rajibpur", "Chilmari", "Kurigram Sadar", "Nageshwari", "Phulbari", "Rajarhat", "Raomari", "Ulipur"] },
      { name: "Lalmonirhat", upazilas: ["Aditmari", "Hatibandha", "Kaliganj", "Lalmonirhat Sadar", "Patgram"] },
      { name: "Nilphamari", upazilas: ["Dimla", "Domar", "Jaldhaka", "Kishoreganj", "Nilphamari Sadar", "Saidpur"] },
      { name: "Panchagarh", upazilas: ["Atwari", "Boda", "Debiganj", "Panchagarh Sadar", "Tetulia"] },
      { name: "Rangpur", upazilas: ["Badarganj", "Gangachhara", "Kaunia", "Mithapukur", "Pirgachha", "Pirganj", "Rangpur Sadar", "Taraganj"] },
      { name: "Thakurgaon", upazilas: ["Baliadangi", "Haripur", "Pirganj", "Ranisankail", "Thakurgaon Sadar"] },
    ],
  },
  {
    name: "Sylhet",
    districts: [
      { name: "Habiganj", upazilas: ["Ajmiriganj", "Bahubal", "Baniyachong", "Chunarughat", "Habiganj Sadar", "Lakhai", "Madhabpur", "Nabiganj", "Shayestaganj"] },
      { name: "Moulvibazar", upazilas: ["Barlekha", "Juri", "Kamalganj", "Kulaura", "Moulvibazar Sadar", "Rajnagar", "Sreemangal"] },
      { name: "Sunamganj", upazilas: ["Bishwamvarpur", "Chhatak", "Dakshin Sunamganj", "Derai", "Dharampasha", "Dowarabazar", "Jagannathpur", "Jamalganj", "Sulla", "Sunamganj Sadar", "Tahirpur", "Madhyanagar"] },
      { name: "Sylhet", upazilas: ["Balaganj", "Beanibazar", "Bishwanath", "Companiganj", "Dakshin Surma", "Fenchuganj", "Golapganj", "Gowainghat", "Jaintiapur", "Kanaighat", "Osmani Nagar", "Sylhet Sadar", "Zakiganj"] },
    ],
  },
];

// --- Lookup helpers --------------------------------------------------------

export const DIVISION_NAMES: string[] = DIVISIONS.map((d) => d.name);

export function districtsOf(division: string | null | undefined): District[] {
  if (!division) return [];
  return DIVISIONS.find((d) => d.name === division)?.districts ?? [];
}

export function districtNamesOf(division: string | null | undefined): string[] {
  return districtsOf(division).map((d) => d.name);
}

export function upazilasOf(
  division: string | null | undefined,
  district: string | null | undefined,
): string[] {
  if (!district) return [];
  return (
    districtsOf(division).find((d) => d.name === district)?.upazilas ?? []
  );
}

/** All districts, flattened — used to validate a district without its division. */
export const ALL_DISTRICTS: { division: string; district: string }[] =
  DIVISIONS.flatMap((division) =>
    division.districts.map((d) => ({ division: division.name, district: d.name })),
  );

/** Validates a division/district/upazila triple, ignoring blanks. */
export function isValidLocation(input: {
  division?: string | null;
  district?: string | null;
  upazila?: string | null;
}): boolean {
  const { division, district, upazila } = input;
  if (!division) return !district && !upazila;
  if (!DIVISION_NAMES.includes(division)) return false;
  if (!district) return !upazila;
  if (!districtNamesOf(division).includes(district)) return false;
  if (!upazila) return true;
  return upazilasOf(division, district).includes(upazila);
}
