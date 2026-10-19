export const GROUPS = {
  "groups": [
    {
      "groupId": "g1",
      "name": "Trail Explorers",
      "createdDate": "2026-03-14",
      "members": [
        { "userId": "u1", "firstName": "Rob", "lastName": "Smith", "email": "rob.smith@example.com", "role": "owner", "dateJoined": "2026-03-14" },
        { "userId": "u2", "firstName": "Alice", "lastName": "Smith", "email": "alice.smith@example.com", "role": "member", "dateJoined": "2026-03-16" },
        { "userId": "u3", "firstName": "Jordan", "lastName": "Smith", "email": "jordan.smith@example.com", "role": "member", "dateJoined": "2026-03-20" },
        { "userId": "u4", "firstName": "Priya", "lastName": "Smith", "email": "priya.smith@example.com", "role": "member", "dateJoined": "2026-04-02" },
        { "userId": "u5", "firstName": "Sam", "lastName": "Smith", "email": "sam.smith@example.com", "role": "member", "dateJoined": "2026-05-11" }
      ],
      "invitations": [
        { "invitationId": "i1", "inviteeEmail": "tyler.brooks@example.com", "status": "pending", "sentDate": "2026-10-12", "sentBy": "u1" },
        { "invitationId": "i2", "inviteeEmail": "nina.patel@example.com", "status": "pending", "sentDate": "2026-10-14", "sentBy": "u1" }
      ],
      "messages": [
        { "messageId": "m1", "userId": "u2", "firstName": "Alice", "lastName": "Smith", "text": "Message 1", "sentTime": "2026-10-11T19:05:00-04:00" },
        { "messageId": "m2", "userId": "u3", "firstName": "Jordan", "lastName": "Smith", "text": "Message 2", "sentTime": "2026-10-11T19:12:00-04:00" },
        { "messageId": "m3", "userId": "u1", "firstName": "Rob", "lastName": "Smith", "text": "Message 3", "sentTime": "2026-10-11T19:20:00-04:00" },
        { "messageId": "m4", "userId": "u4", "firstName": "Priya", "lastName": "Smith", "text": "Message 4", "sentTime": "2026-10-14T08:31:00-04:00" },
        { "messageId": "m5", "userId": "u5", "firstName": "Sam", "lastName": "Smith", "text": "Message 5", "sentTime": "2026-10-14T08:47:00-04:00" },
        { "messageId": "m6", "userId": "u2", "firstName": "Alice", "lastName": "Smith", "text": "Message 6", "sentTime": "2026-10-15T07:58:00-04:00" }
      ]
    },
    {
      "groupId": "g2",
      "name": "Weekend Warriors",
      "createdDate": "2026-06-02",
      "members": [
        { "userId": "u6", "firstName": "Maya", "lastName": "Smith", "email": "maya.smith@example.com", "role": "owner", "dateJoined": "2026-06-02", "heartRate": 168, "percentOfMax": 91, "status": "elevated",
          "emergencyContacts": [{ "contactId": "ec3", "firstName": "Mark", "lastName": "Smith", "phoneNumber": "123-555-0111"  }],
        },
        { "userId": "u1", "firstName": "Rob", "lastName": "Smith", "email": "rob.smith@example.com", "role": "member", "dateJoined": "2026-06-05",  "emergencyContacts": [{ "contactId": "ec4", "firstName": "Mia", "lastName": "Smith", "phoneNumber": "123-555-0122" }]  },
        { "userId": "u7", "firstName": "Omar", "lastName": "Smith", "email": "omar.smith@example.com", "role": "member", "dateJoined": "2026-07-21", "emergencyContacts": [{ "contactId": "ec5", "firstName": "Lena", "lastName": "Smith", "phoneNumber": "123-555-0133" }] }
      ],
      "invitations": [
        { "invitationId": "i3", "inviteeEmail": "chris.lee@example.com", "status": "declined", "sentDate": "2026-09-10", "sentBy": "u6" }
      ],
      "messages": [
        { "messageId": "m7", "userId": "u6", "firstName": "Maya", "lastName": "Smith", "text": "Message 1", "sentTime": "2026-10-13T20:15:00-04:00" },
        { "messageId": "m8", "userId": "u7", "firstName": "Omar", "lastName": "Smith", "text": "Message 2", "sentTime": "2026-10-13T20:22:00-04:00" },
        { "messageId": "m9", "userId": "u1", "firstName": "Rob", "lastName": "Smith", "text": "Message 3", "sentTime": "2026-10-14T09:02:00-04:00" },
        { "messageId": "m10", "userId": "u6", "firstName": "Maya", "lastName": "Smith", "text": "Message 4", "sentTime": "2026-10-14T09:15:00-04:00" }
      ]
    }
  ]
}