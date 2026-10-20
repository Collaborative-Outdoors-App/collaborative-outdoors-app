export const CURRENT_USER = {
  "currentUser": {
    "userId": "u1",
    "firstName": "Rob",
    "lastName": "Smith",
    "email": "rob.smith@example.com",
    "dateOfBirth": "1990-05-17",
    "weightKg": 82,
    "emergencyContacts": [
      { "contactId": "ec1", "firstName": "Carol", "lastName": "Smith", "phoneNumber": "123-555-0142" },
      { "contactId": "ec2", "firstName": "Dave", "lastName": "Smith", "phoneNumber": "123-555-0187" }
    ],
    "groupIds": ["g1", "g2"],
    "totalDistance": 276.4,
    "twoStepEnabled": true,
    "wearableDevice": { "name": "Fitbit Charge 6", "provider": "Google Fit", "heartRate": 112 },
    "mfa": { "phoneNumber": "289-555-3222", "authenticatorKey": "xbcs-dssc-fzccs-dfsz" },
    "achievements": [
      { "id": "hike_10km", "unlockDate": "2025-10-18" },
      { "id": "hike_25km", "unlockDate": "2025-12-18" },
      { "id": "hike_50km", "unlockDate": "2026-02-18" },
      { "id": "hike_100km", "unlockDate": "2026-07-18" },
      { "id": "hike_250km", "unlockDate": "2026-10-18" }
    ],
    "personalRecords": [
      {
        "id": "most_hikes_week",
        "value": 7,
        "setOn": "2026-01-11"
      },
      {
        "id": "most_hikes_month",
        "value": 20,
        "setOn": "2026-01-31"
      },
      {
        "id": "longest_distance",
        "value": 32,
        "setOn": "2025-10-12"
      },
      {
        "id": "longest_duration",
        "value": 225,
        "setOn": "2025-10-12"
      },
    ]
  }
}

export const DISTANCE_TRAVELLED_TRENDS = [
  { km: 8.4 },
  { km: 6.1 },
  { km: 0 },
  { km: 3.2 },
  { km: 0 },
  { km: 4.5 },
  { km: 0 },
  { km: 12.3 },
  { km: 9.7 },
  { km: 0 },
  { km: 2.8 },
  { km: 0 },
  { km: 5.0 },
  { km: 0 },
  { km: 14.2 },
  { km: 7.9 },
  { km: 0 },
  { km: 3.6 },
  { km: 0 },
  { km: 4.8 },
  { km: 0 },
  { km: 15.8 },
  { km: 10.4 },
  { km: 6.5 },
  { km: 0 },
  { km: 3.9 },
  { km: 0 },
  { km: 5.4 },
  { km: 16.7 },
  { km: 11.2 },
];

export const TIME_SPENT_HIKING_TRENDS = [
  { minutes: 105 },
  { minutes: 73 },
  { minutes: 0 },
  { minutes: 42 },
  { minutes: 0 },
  { minutes: 54 },
  { minutes: 0 },
  { minutes: 160 },
  { minutes: 121 },
  { minutes: 0 },
  { minutes: 34 },
  { minutes: 0 },
  { minutes: 62 },
  { minutes: 0 },
  { minutes: 192 },
  { minutes: 99 },
  { minutes: 0 },
  { minutes: 43 },
  { minutes: 0 },
  { minutes: 60 },
  { minutes: 0 },
  { minutes: 213 },
  { minutes: 135 },
  { minutes: 78 },
  { minutes: 0 },
  { minutes: 49 },
  { minutes: 0 },
  { minutes: 65 },
  { minutes: 225 },
  { minutes: 146 },
];

export const ACHIEVEMENT_DATA = [
  { id: 'hike_10km', name: 'Distance Achievement 1', description: 'Hike 10km', requirement: 10 },
  { id: 'hike_25km', name: 'Distance Achievement 2', description: 'Hike 25km', requirement: 25 },
  { id: 'hike_50km', name: 'Distance Achievement 3', description: 'Hike 50km', requirement: 50 },
  { id: 'hike_100km', name: 'Distance Achievement 4', description: 'Hike 100km', requirement: 100 },
  { id: 'hike_250km', name: 'Distance Achievement 5', description: 'Hike 250km', requirement: 250 },
  { id: 'hike_500km', name: 'Distance Achievement 6', description: 'Hike 500km', requirement: 500 },
  { id: 'hike_1000km', name: 'Distance Achievement 7', description: 'Hike 1000km', requirement: 1000 },
];

export const PERSONAL_RECORDS = [
  {
    id: 'most_hikes_week',
    name: 'Most hikes in a week',
    unit: 'hikes',
  },
  {
    id: 'most_hikes_month',
    name: 'Most hikes in a month',
    unit: 'hikes',
  },
  {
    id: 'longest_distance',
    name: 'Longest distance travelled',
    unit: 'km',
  },
  {
    id: 'longest_duration',
    name: 'Longest hike duration',
    unit: 'minutes',
  }
];