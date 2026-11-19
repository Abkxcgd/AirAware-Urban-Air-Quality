export interface IndoorGuideItem {
  id: string;
  category: string;
  title: string;
  summary: string;
  steps: string[];
}

export const INDOOR_AIR_GUIDES: IndoorGuideItem[] = [
  {
    id: 'dust-control',
    category: 'Particles & Allergens',
    title: 'Indoor Dust Control',
    summary: 'Prevent settled PM10, dust mites, and outdoor soot from re-entering breathing zones.',
    steps: [
      'Damp-mop hard floors and wipe sills with microfiber cloths instead of dry dusting.',
      'Leave outdoor shoes at the entryway to keep tracked brake dust and soil out of living spaces.',
      'Wash bedding weekly in warm water and vacuum upholstery using a sealed HEPA-filter vacuum.',
    ],
  },
  {
    id: 'avoid-smoke',
    category: 'Combustion Sources',
    title: 'Avoiding Indoor Smoke',
    summary: 'Indoor burning can spike fine particulate matter above severe outdoor smog levels.',
    steps: [
      'Keep tobacco smoking and vaping strictly outdoors and away from open windows.',
      'Replace paraffin candles, incense sticks, and open fireplaces with LED lights during high-AQI days.',
      'Never run fuel-burning space heaters indoors without dedicated exterior venting.',
    ],
  },
  {
    id: 'ventilation-timing',
    category: 'Airflow Strategy',
    title: 'Smart Ventilation Timing',
    summary: 'Sync window opening with cleaner outdoor hours to flush indoor CO₂ without inviting smog.',
    steps: [
      'Open opposite-side windows for 15 minutes when outdoor AQI is Good or Moderate.',
      'Avoid opening street-facing windows during morning and evening rush-hour traffic peaks.',
      'During unhealthy outdoor AQI alerts, keep windows sealed and switch to mechanical filtration.',
    ],
  },
  {
    id: 'air-purifier',
    category: 'Filtration Hardware',
    title: 'Air Purifier Selection & Maintenance',
    summary: 'Size and maintain true HEPA filtration so indoor air turns over reliably.',
    steps: [
      'Choose a True HEPA (H13) unit whose Clean Air Delivery Rate (CADR) matches your room square footage.',
      'Avoid ozone-generating "ionizer" modes that can emit respiratory irritants.',
      'Vacuum the outer mesh pre-filter monthly and replace the HEPA cartridge per manufacturer hours.',
    ],
  },
  {
    id: 'kitchen-ventilation',
    category: 'Cooking Emissions',
    title: 'Kitchen Ventilation',
    summary: 'High-heat searing and gas burners release concentrated NO₂ and ultrafine aerosols.',
    steps: [
      'Turn on your range hood before lighting burners and leave it running 10 minutes after cooking.',
      'Use back burners when possible—exhaust hoods capture fumes much more effectively over rear elements.',
      'Prefer lids on simmering pots and lower-smoke oils when sautéing.',
    ],
  },
  {
    id: 'household-reduction',
    category: 'Chemical & VOC Control',
    title: 'Household Pollution Reduction',
    summary: 'Cut volatile organic compounds (VOCs) from everyday sprays, paints, and cleaners.',
    steps: [
      'Switch from aerosol air fresheners and harsh bleach sprays to fragrance-free liquid cleaners.',
      'Store paints, solvents, and adhesives outside living rooms or in tightly sealed exterior storage.',
      'Air out new furniture or carpets thoroughly during clean-AQI days to speed off-gassing.',
    ],
  },
];

export interface SustainablePractice {
  id: string;
  area: string;
  title: string;
  impact: string;
  actionTip: string;
}

export const SUSTAINABLE_PRACTICES: SustainablePractice[] = [
  {
    id: 'public-transit',
    area: 'Mobility',
    title: 'Public Transportation',
    impact: 'Replaces single-occupancy tailpipe NO₂ and brake/tire particulate emissions per kilometer.',
    actionTip: 'Swap two solo car errands this week for bus, metro, or commuter rail.',
  },
  {
    id: 'carpooling',
    area: 'Shared Commute',
    title: 'Carpooling & Trip Chaining',
    impact: 'Cuts cold-start exhaust spikes, which account for a disproportionate share of urban hydrocarbon output.',
    actionTip: 'Coordinate shared school or office commutes and combine errands into one warm-engine loop.',
  },
  {
    id: 'energy-conservation',
    area: 'Home Energy',
    title: 'Energy Conservation',
    impact: 'Lowering peak electricity demand reduces fossil-fuel peaker plant dispatch near urban corridors.',
    actionTip: 'Set smart thermostat setbacks, unplug idle standby loads, and air-dry laundry when practical.',
  },
  {
    id: 'waste-reduction',
    area: 'Zero Open Burning',
    title: 'Waste Reduction & Composting',
    impact: 'Prevents landfill methane and eliminates backyard leaf or trash burning—a major local PM2.5 source.',
    actionTip: 'Compost yard trimmings and separate recyclables instead of burning organic garden waste.',
  },
  {
    id: 'cleaner-cooking',
    area: 'Clean Fuels',
    title: 'Cleaner Cooking Practices',
    impact: 'Electric induction or well-vented clean fuels eliminate indoor carbon monoxide and soot exposure.',
    actionTip: 'Use electric kettles, induction hobs, or pressure cookers to cut fuel use and indoor emissions.',
  },
  {
    id: 'eco-habits',
    area: 'Everyday Choices',
    title: 'Environment-Friendly Habits',
    impact: 'Supports urban green canopies that cool streets and help capture airborne coarse dust.',
    actionTip: 'Choose electric lawn tools over 2-stroke gas trimmers and support neighborhood tree planting.',
  },
];

export interface CommunityActionItem {
  id: string;
  title: string;
  category: string;
  points: number;
  description: string;
}

export const COMMUNITY_ACTIONS: CommunityActionItem[] = [
  {
    id: 'act-transit',
    title: 'Took transit, walked, or biked instead of driving solo',
    category: 'Clean Mobility',
    points: 20,
    description: 'Zero tailpipe emissions for today’s trip.',
  },
  {
    id: 'act-no-idle',
    title: 'Turned off engine during pickups (zero idling)',
    category: 'Fuel Habits',
    points: 15,
    description: 'Eliminates localized exhaust buildup near schools and sidewalks.',
  },
  {
    id: 'act-hood',
    title: 'Used kitchen exhaust ventilation while cooking',
    category: 'Indoor Health',
    points: 15,
    description: 'Captures NO₂ and fine cooking aerosols at the source.',
  },
  {
    id: 'act-energy',
    title: 'Shifted high-load appliances off peak grid hours',
    category: 'Energy',
    points: 15,
    description: 'Reduces strain on fossil backup generation.',
  },
  {
    id: 'act-share',
    title: 'Shared local AQI update or clean-air tip with a neighbor',
    category: 'Community',
    points: 20,
    description: 'Helps vulnerable neighbors plan safer outdoor timing.',
  },
  {
    id: 'act-waste',
    title: 'Composted or recycled instead of burning/landfilling',
    category: 'Zero Smoke',
    points: 15,
    description: 'Prevents unnecessary smoke and methane emissions.',
  },
];

export const AWARENESS_CAMPAIGNS = [
  {
    id: 'idle-free',
    title: 'Idle-Free School Drop-Off Pledge',
    audience: 'Parents & Neighborhood Associations',
    summary:
      'Organize curb signage reminding drivers to switch off engines while waiting outside schools, protecting children from concentrated tailpipe NO₂.',
  },
  {
    id: 'clean-air-buddy',
    title: 'Neighborhood Clean-Air Check-In',
    audience: 'Community Groups & Caregivers',
    summary:
      'Pair volunteers with older adults or residents with asthma to send morning AQI alerts and help with groceries on Unhealthy air days.',
  },
  {
    id: 'commute-challenge',
    title: 'Car-Free Wednesday Commute',
    audience: 'Local Workplaces & Campuses',
    summary:
      'Coordinate carpool matching, transit passes, and safe cycling groups once a week to visibly cut rush-hour congestion.',
  },
];

export const SHAREABLE_MESSAGES = [
  {
    id: 'msg-idle',
    label: 'Anti-Idling Reminder',
    text: 'Turning off your engine when parked for more than 10 seconds saves fuel and keeps toxic exhaust out of neighborhood lungs. #CleanAir #AirAware',
  },
  {
    id: 'msg-commute',
    label: 'Active Commute Call',
    text: 'Swapped a solo drive for public transit today—one small shift toward cleaner urban air and healthier streets. #SustainableMobility #AirAware',
  },
  {
    id: 'msg-check',
    label: 'Daily AQI Awareness',
    text: 'Before heading out for a run today, check your local PM2.5 and AQI window so you can breathe easier outdoors. #UrbanHealth #AirAware',
  },
];
