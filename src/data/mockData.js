export const mockUserData = {
  name: "Alex Rivera",
  netBalance: 450.00,
  youOwe: 1200.00,
  youAreOwed: 450.00,
  oweGroupCount: 1,
  owedGroupCount: 2,
  personalSpending: 12450.00,
  monthlyBudget: 20000.00,
};

export const mockGroups = [
  {
    id: "paris-trip-2024",
    name: "Paris Trip 2024",
    membersCount: 4,
    balance: 450.00,
    statusText: "You are owed ₱450",
    statusType: "owed", // 'owed' | 'owe' | 'settled'
    iconId: "set1_2_3", // Travel / Flight
    iconType: "airplane",
    iconBg: "#FFEBEF",
    iconColor: "#D94668",
    category: "Travel & Trips",
    recentExpense: "Eiffel Tower Tickets & Bistro Dinner",
    totalSpending: 2510.50,
    expenses: [
      {
        id: "exp-p-1",
        name: "Eiffel Tower Tickets & Bistro Dinner",
        amount: 1850.00,
        splitType: "Split Equally",
        paidBy: "Alex Rivera",
        date: "Jan 14, 2024"
      },
      {
        id: "exp-p-2",
        name: "Snacks, Drinks & Extra Rice",
        amount: 660.50,
        splitType: "Itemized",
        paidBy: "Sam Taylor",
        date: "Jan 16, 2024"
      }
    ],
    members: [
      {
        id: "mem-1",
        name: "Alex Rivera",
        isCurrentUser: true,
        role: "Admin",
        email: "alex.rivera@example.com",
        spentAmount: 1240.00,
        joinedDate: "Jan 12, 2024",
        avatarType: "image",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        avatarEmoji: "🦖",
        isOnline: true,
        owes: 450.00
      },
      {
        id: "mem-2",
        name: "Sam Taylor",
        isCurrentUser: false,
        role: "Member",
        email: "sam.t@example.com",
        spentAmount: 850.50,
        joinedDate: "Jan 15, 2024",
        avatarType: "image",
        avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
        avatarEmoji: "🏄‍♂️",
        isOnline: false,
        owes: -250.00
      },
      {
        id: "mem-3",
        name: "Jamie Doe",
        isCurrentUser: false,
        role: "Member",
        email: "jamie.d@example.com",
        spentAmount: 420.00,
        joinedDate: "Feb 02, 2024",
        avatarType: "initials",
        initials: "JD",
        avatarEmoji: "📸",
        isOnline: false,
        owes: -200.00
      }
    ],
    pendingInvites: [
      {
        id: "inv-1",
        name: "Pending Invite",
        email: "chris.w@example.com",
        status: "Waiting for response...",
        date: "Feb 10, 2024"
      }
    ]
  },
  {
    id: "apartment-bills",
    name: "Apartment Bills",
    membersCount: 2,
    balance: -1200.00,
    statusText: "You owe ₱1,200",
    statusType: "owe",
    iconId: "set2_2_1", // House / Apartment
    iconType: "apartment",
    iconBg: "#FFEBEF",
    iconColor: "#D94668",
    category: "Rent & Utilities",
    recentExpense: "Meralco Bill & Water",
    totalSpending: 2510.50,
    expenses: [
      {
        id: "exp-apt-1",
        name: "Meralco Bill & Water",
        amount: 1850.00,
        splitType: "Split Equally",
        paidBy: "Miguel Tan",
        date: "Jan 28, 2024"
      },
      {
        id: "exp-apt-2",
        name: "Snacks, Drinks & Extra Rice",
        amount: 660.50,
        splitType: "Itemized",
        paidBy: "Alex Rivera",
        date: "Feb 02, 2024"
      }
    ],
    members: [
      {
        id: "mem-apt-1",
        name: "Alex Rivera",
        isCurrentUser: true,
        role: "Admin",
        email: "alex.rivera@example.com",
        spentAmount: 600.00,
        joinedDate: "Jan 05, 2024",
        avatarType: "image",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        avatarEmoji: "🦖",
        isOnline: true,
        owes: -1200.00
      },
      {
        id: "mem-apt-2",
        name: "Miguel Tan",
        isCurrentUser: false,
        role: "Member",
        email: "miguel.tan@example.com",
        spentAmount: 1800.00,
        joinedDate: "Jan 05, 2024",
        avatarType: "initials",
        initials: "MT",
        avatarEmoji: "👨‍💻",
        isOnline: false,
        owes: 1200.00
      }
    ],
    pendingInvites: []
  },
  {
    id: "weekend-getaway",
    name: "Weekend Getaway",
    membersCount: 6,
    balance: 0.00,
    statusText: "Settled",
    statusType: "settled",
    iconId: "set1_3_2", // Beach / Sun
    iconType: "beach",
    iconBg: "#FFF1E6",
    iconColor: "#E06D28",
    category: "Travel & Trips",
    recentExpense: "Resort Stay & BBQ Dinner",
    totalSpending: 6200.00,
    expenses: [
      {
        id: "exp-wg-1",
        name: "Resort Villa Stay (2 Nights)",
        amount: 4500.00,
        splitType: "Split Equally",
        paidBy: "Chloe Diaz",
        date: "Jan 21, 2024"
      },
      {
        id: "exp-wg-2",
        name: "BBQ Dinner & Beach Drinks",
        amount: 1700.00,
        splitType: "Itemized",
        paidBy: "Alex Rivera",
        date: "Jan 22, 2024"
      }
    ],
    members: [
      {
        id: "mem-wg-1",
        name: "Alex Rivera",
        isCurrentUser: true,
        role: "Admin",
        email: "alex.rivera@example.com",
        spentAmount: 2500.00,
        joinedDate: "Jan 20, 2024",
        avatarType: "image",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        avatarEmoji: "🦖",
        isOnline: true,
        owes: 0.00
      },
      {
        id: "mem-wg-2",
        name: "Chloe Diaz",
        isCurrentUser: false,
        role: "Member",
        email: "chloe.d@example.com",
        spentAmount: 2500.00,
        joinedDate: "Jan 20, 2024",
        avatarType: "initials",
        initials: "CD",
        avatarEmoji: "📸",
        isOnline: false,
        owes: 0.00
      },
      {
        id: "mem-wg-3",
        name: "Justin Perez",
        isCurrentUser: false,
        role: "Member",
        email: "justin.p@example.com",
        spentAmount: 1200.00,
        joinedDate: "Jan 21, 2024",
        avatarType: "initials",
        initials: "JP",
        avatarEmoji: "🎧",
        isOnline: false,
        owes: 0.00
      }
    ],
    pendingInvites: [
      {
        id: "inv-wg-1",
        name: "Pending Invite",
        email: "carlo.k@example.com",
        status: "Waiting for response...",
        date: "Feb 01, 2024"
      }
    ]
  },
  {
    id: "friday-dinner",
    name: "Friday Dinner Club",
    membersCount: 8,
    balance: 15.50,
    statusText: "You are owed ₱15.50",
    statusType: "owed",
    iconId: "set2_1_2", // Dining Plate & Cutlery
    iconType: "dining",
    iconBg: "#FFF1E6",
    iconColor: "#E26D24",
    category: "Food & Dining",
    recentExpense: "Samgyupsal & Extra Rice",
    members: [
      {
        id: "mem-fd-1",
        name: "Alex Rivera",
        isCurrentUser: true,
        role: "Admin",
        email: "alex.rivera@example.com",
        spentAmount: 850.00,
        joinedDate: "Jan 10, 2024",
        avatarType: "image",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        avatarEmoji: "🦖",
        isOnline: true,
        owes: 15.50
      },
      {
        id: "mem-fd-2",
        name: "Ken Santos",
        isCurrentUser: false,
        role: "Member",
        email: "ken.s@example.com",
        spentAmount: 450.00,
        joinedDate: "Jan 10, 2024",
        avatarType: "initials",
        initials: "KS",
        avatarEmoji: "🍜",
        isOnline: false,
        owes: -5.50
      }
    ],
    pendingInvites: []
  },
  {
    id: "bowling-club",
    name: "Bowling League",
    membersCount: 8,
    balance: 0.00,
    statusText: "Settled",
    statusType: "settled",
    iconId: "set3_4_1", // Gaming / Recreation
    iconType: "bowling",
    iconBg: "#EEF0FC",
    iconColor: "#4F67D8",
    category: "Recreation",
    recentExpense: "2 Games + Shoe Rental",
    members: [
      {
        id: "mem-b-1",
        name: "Alex Rivera",
        isCurrentUser: true,
        role: "Admin",
        email: "alex.rivera@example.com",
        spentAmount: 600.00,
        joinedDate: "Jan 18, 2024",
        avatarType: "image",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        avatarEmoji: "🦖",
        isOnline: true,
        owes: 0.00
      }
    ],
    pendingInvites: []
  },
  {
    id: "work-cafe-bgc",
    name: "Work Cafe BGC",
    membersCount: 3,
    balance: -80.50,
    statusText: "You owe ₱80.50",
    statusType: "owe",
    iconId: "set3_1_1", // Coffee Machine & Cup
    iconType: "coffee",
    iconBg: "#FDF0ED",
    iconColor: "#B45309",
    category: "Work & Cafe",
    recentExpense: "Spanish Latte & Croissant",
    members: [
      {
        id: "mem-wc-1",
        name: "Alex Rivera",
        isCurrentUser: true,
        role: "Admin",
        email: "alex.rivera@example.com",
        spentAmount: 320.00,
        joinedDate: "Jan 25, 2024",
        avatarType: "image",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        avatarEmoji: "🦖",
        isOnline: true,
        owes: -80.50
      }
    ],
    pendingInvites: []
  }
];

export const mockSettlements = [
  {
    id: "set-1",
    person: "Miguel Tan",
    group: "Apartment Bills",
    type: "owe",
    amount: 1200.00,
    avatar: "👨‍💻",
    dueDate: "Today",
    gcashNumber: "0917 •••• 421",
    status: "Pending"
  },
  {
    id: "set-2",
    person: "Sam Taylor",
    group: "Paris Trip 2024",
    type: "owed",
    amount: 450.00,
    avatar: "🏄‍♂️",
    dueDate: "Yesterday",
    gcashNumber: "0998 •••• 882",
    status: "Reminder Sent"
  },
  {
    id: "set-3",
    person: "Jamie Doe",
    group: "Paris Trip 2024",
    type: "owed",
    amount: 200.00,
    avatar: "📸",
    dueDate: "Sep 24",
    gcashNumber: "0915 •••• 119",
    status: "Pending"
  },
  {
    id: "set-4",
    person: "Pamela Cruz",
    group: "Work Cafe BGC",
    type: "owe",
    amount: 80.50,
    avatar: "☕",
    dueDate: "Sep 22",
    gcashNumber: "0920 •••• 554",
    status: "Pending"
  },
  {
    id: "set-5",
    person: "Ken Santos",
    group: "Friday Dinner Club",
    type: "owed",
    amount: 15.50,
    avatar: "🍜",
    dueDate: "Sep 20",
    gcashNumber: "0917 •••• 993",
    status: "Completed"
  }
];

export const mockNotifications = [
  {
    id: "notif-1",
    title: "Sam Taylor settled ₱450.00 in Paris Trip 2024",
    time: "10m ago",
    read: false,
    type: "payment"
  },
  {
    id: "notif-2",
    title: "New expense in Apartment Bills: Meralco Bill",
    time: "2h ago",
    read: false,
    type: "expense"
  },
  {
    id: "notif-3",
    title: "Friday Dinner Club ambagan calculated",
    time: "1d ago",
    read: true,
    type: "split"
  }
];
